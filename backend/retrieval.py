"""Finds the passages of the course papers that best answer a student's question.

1. Indexing: every page of every ingested paper is cut into passages of about 900 characters.
2. Keyword ranking (BM25): passages sharing rare words with the question score highest.
3. Meaning ranking (embeddings): passages whose vector is close to the question's vector.
4. Hybrid: both rankings are merged by reciprocal rank fusion.
"""
import math
import re
from collections import Counter
from dataclasses import dataclass, field
from functools import lru_cache

from .catalog import DATA, course_for_id, exam_label, file_version, materials, read_json, questions, source_path
from .embeddings import Vector, cosine, embed_query, stored_vectors, text_key

STOPWORDS = set("the and for are but not you all any can had her was one our out has his how its may who did get him she too use what when where which while with this that from they them then than there their these those would could should about into your more most some such only other also been being have were will each does just very what's explain".split())

# Notices are student-specific and never part of the answerable corpus.
ANSWERABLE_KINDS = {"paper", "answer-key", "handout"}

# Words from the exam header printed on every page; they say nothing about a passage's content.
HEADER_WORDS = set("bits pilani dubai campus hyderabad goa birla institute technology science international academic city department division".split())

# Two-letter course terms worth keeping; other short tokens are mostly noise.
SHORT_TERMS = {"dp", "np", "em", "ai", "ml", "pc", "qp", "rl", "nn", "lp"}

# Students type abbreviations that papers spell out ("DP" vs "dynamic programming"); expand them in the query only.
ABBREVIATIONS = {
    "dp": "dynamic programming",
    "mst": "minimum spanning tree",
    "svm": "support vector machine",
    "nn": "neural network",
    "rl": "reinforcement learning",
    "lp": "linear programming",
    "em": "expectation maximization",
    "bfs": "breadth first search",
    "dfs": "depth first search",
}

INGESTED_FILE = DATA / "ingested-materials.json"


@dataclass(eq=False)  # eq=False: each passage is its own object, so it can be a dictionary key in hybrid_retrieve
class Passage:
    material: dict
    page: int | None  # None for DOCX files, which have no pages
    text: str
    terms: Counter  # word -> how often it appears in this passage
    sequence: str  # the words in order, padded with spaces, for two-word phrase matches
    length: int  # number of words
    visuals: list = field(default_factory=list)  # diagram transcriptions, for diagram questions


# ---------- Text processing ----------

def singular(word: str) -> str:
    """Conservative plural folding: "queries" -> "query", "graphs" -> "graph", but "class", "bus", "analysis" and "uses" stay intact."""
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 4 and word.endswith(("sses", "ches", "shes", "xes")):
        return word[:-2]
    if len(word) > 4 and word.endswith("s") and not word.endswith(("ss", "us", "is")):
        return word[:-1]
    return word


def tokenize(text: str) -> list[str]:
    """Lowercase words without stopwords, exam-header words or short noise, folded to singular."""
    words = re.split(r"[^a-z0-9]+", re.sub(r"[’']", "", text.lower()))
    return [
        singular(word) for word in words
        if (len(word) > 2 or word in SHORT_TERMS) and word not in STOPWORDS and word not in HEADER_WORDS
    ]


def chunk(text: str, size: int = 900) -> list[str]:
    """Splits a page into passages of about `size` characters, keeping paragraphs whole."""
    paragraphs = [re.sub(r"\s+", " ", part).strip() for part in re.split(r"\n\s*\n|(?<=\.)\s*\n", text)]
    chunks = []
    current = ""
    for paragraph in paragraphs:
        if not paragraph:
            continue
        if current and len(current) + len(paragraph) > size:
            chunks.append(current)
            current = ""
        current = f"{current} {paragraph}" if current else paragraph
    if current:
        chunks.append(current)
    return chunks


def index_passage(material: dict, page: int | None, text: str, visuals: list) -> Passage:
    tokens = tokenize(text)
    return Passage(material, page, text, Counter(tokens), f" {' '.join(tokens)} ", len(tokens), visuals)


# ---------- The index ----------

def _material_for_ingested(item: dict) -> dict | None:
    # Older catalogues have no relativePath; their files all sat directly in a source folder.
    if item.get("relativePath"):
        return next((material for material in materials if material["source"] == item["relativePath"]), None)
    return next((material for material in materials if material["source"].endswith("/" + item["fileName"])), None)


def build_index(ingested: list[dict]) -> list[Passage]:
    passages = []
    for item in ingested:
        material = _material_for_ingested(item)
        if material is None or material["kind"] not in ANSWERABLE_KINDS or not item["text"].strip():
            continue
        is_pdf = item["extension"] == ".pdf"
        # Older catalogues joined PDF pages with a blank line; DOCX text has no pages.
        pages = item.get("pages")
        if pages is None:
            pages = item["text"].split("\n\n")[1:] if is_pdf else [item["text"]]
        for number, page_text in enumerate(pages, start=1):
            for text in chunk(page_text):
                passages.append(index_passage(material, number if is_pdf else None, text, []))
        # Keep each diagram question whole, even when several diagrams share a source page.
        for question in questions:
            if question["materialId"] == material["id"] and question.get("visuals"):
                visuals = question["visuals"]
                text = question["text"] + "\n\n" + "\n\n".join(f"{visual['caption']}\n{visual['description']}" for visual in visuals)
                passages.append(index_passage(material, question["page"], text, visuals))
    return passages


def current_index() -> list[Passage]:
    """All passages; rebuilt whenever ingest rewrites data/ingested-materials.json, without restarting the server."""
    return _index_for(file_version(INGESTED_FILE))


@lru_cache(maxsize=1)
def _index_for(version: float | None) -> list[Passage]:
    return build_index(read_json(INGESTED_FILE) or [])


def course_passages(course_id: str) -> list[Passage]:
    return [passage for passage in current_index() if passage.material["courseId"] == course_id]


# ---------- Turning passages into citable sources ----------

def label(material: dict, page: int | None) -> str:
    course = course_for_id(material["courseId"])
    if material["kind"] == "handout":
        return f"{course['code'] if course else ''} Course Handout".strip()
    if material["kind"] == "answer-key":
        return f"{material['title']} ({material['year']})"
    campus = f" ({material['campus']})" if course and material["campus"] != course["campus"] else ""
    return exam_label(material, page) + campus


def to_sources(passages: list[Passage]) -> list[dict]:
    """The numbered sources the chatbot cites as [1], [2], ..."""
    sources = []
    for position, passage in enumerate(passages, start=1):
        source = {
            "id": position,
            "label": label(passage.material, passage.page),
            "page": passage.page,
            "href": source_path(passage.material["fileName"]) + (f"#page={passage.page}" if passage.page else ""),
            "excerpt": passage.text,
        }
        if passage.visuals:
            source["visuals"] = passage.visuals
        sources.append(source)
    return sources


# ---------- Ranking ----------

def expand_abbreviations(query: str) -> str:
    def expand(match: re.Match) -> str:
        word = match.group(0)
        expansion = ABBREVIATIONS.get(word.lower())
        return f"{word} {expansion}" if expansion else word
    return re.sub(r"[A-Za-z]+", expand, query)


def rank_by_keywords(query: str, index: list[Passage], limit: int) -> list[Passage]:
    """BM25: the standard keyword-ranking formula. Small enough to score one course in memory on every request.

    For each query word, a passage scores more when the word appears in it often (with diminishing returns),
    when the word is rare across the course (idf), and when the passage is short.
    """
    query_tokens = tokenize(expand_abbreviations(query))
    query_terms = list(dict.fromkeys(query_tokens))
    phrases = [f" {first} {second} " for first, second in zip(query_tokens, query_tokens[1:])]
    if not index or not query_terms:
        return []
    average_length = sum(passage.length for passage in index) / len(index)
    document_frequency = {term: sum(1 for passage in index if term in passage.terms) for term in query_terms}

    scored = []
    for passage in index:
        score = 0.0
        for term in query_terms:
            frequency = passage.terms.get(term, 0)
            if not frequency:
                continue
            df = document_frequency[term]
            idf = math.log(1 + (len(index) - df + 0.5) / (df + 0.5))
            score += idf * (frequency * 2.2) / (frequency + 1.2 * (0.25 + 0.75 * passage.length / average_length))
        if score > 0:
            # Titles and names ("theory justice", "surplus value") should beat passages that only share the separate words.
            score += 2 * sum(1 for phrase in phrases if phrase in passage.sequence)
            scored.append((score, passage))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [passage for score, passage in scored[:limit]]


def retrieve(query: str, course_id: str, limit: int = 6) -> list[dict]:
    """Keyword-only retrieval (BM25). Needs no API key."""
    return to_sources(rank_by_keywords(query, course_passages(course_id), limit))


# Below this cosine similarity a passage is not treated as a meaning match, so unrelated questions still find nothing.
MINIMUM_SIMILARITY = 0.3
# Below this a keyword hit is only weakly related in meaning to the question.
KEYWORD_VETO_SIMILARITY = 0.25


def rank_by_meaning(vector: Vector, index: list[Passage], limit: int) -> list[Passage]:
    vectors = stored_vectors()
    scored = []
    for passage in index:
        stored = vectors.get(text_key(passage.text))
        similarity = cosine(vector, stored) if stored is not None else -1
        if similarity >= MINIMUM_SIMILARITY:
            scored.append((similarity, passage))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [passage for similarity, passage in scored[:limit]]


def hybrid_retrieve(query: str, course_id: str, limit: int = 6) -> list[dict]:
    """Keyword matches merged with meaning matches by reciprocal rank fusion.

    Falls back to keywords alone when there is no API key or embed has not been run.
    """
    index = course_passages(course_id)
    keyword = rank_by_keywords(query, index, 30)
    vector = embed_query(expand_abbreviations(query))
    if vector is None:
        return to_sources(keyword[:limit])
    meaning = rank_by_meaning(vector, index, 30)

    # Keyword hits that share only incidental words ("best", "place") with the question are dropped when they are unrelated in meaning.
    vectors = stored_vectors()
    relevant_keyword = [
        passage for passage in keyword
        if text_key(passage.text) not in vectors or cosine(vector, vectors[text_key(passage.text)]) >= KEYWORD_VETO_SIMILARITY
    ]

    # Reciprocal rank fusion uses rank positions only (1st, 2nd, ...), so BM25 scores and cosine
    # similarities never need to be put on one scale. A passage high in both lists wins.
    fused: dict[Passage, float] = {}
    for ranking in (relevant_keyword, meaning):
        for rank, passage in enumerate(ranking):
            fused[passage] = fused.get(passage, 0) + 1 / (60 + rank + 1)
    best = sorted(fused, key=fused.get, reverse=True)[:limit]
    return to_sources(best)


def passage_texts() -> list[str]:
    """Every distinct passage text in the index, for embed."""
    return list(dict.fromkeys(passage.text for passage in current_index()))


def page_source(material_id: str, page: int, source_id: int = 1) -> dict | None:
    """The full extracted text of one paper page, so an explanation always sees the question's own data and tables."""
    passages = [passage for passage in current_index() if passage.material["id"] == material_id and passage.page == page]
    if not passages:
        return None
    material = passages[0].material
    return {
        "id": source_id,
        "label": label(material, page),
        "page": page,
        "href": f"{source_path(material['fileName'])}#page={page}",
        "excerpt": "\n".join(dict.fromkeys(passage.text for passage in passages))[:3000],
    }
