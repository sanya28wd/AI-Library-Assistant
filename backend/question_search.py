"""Keyword search over the curated questions, with topic, exam-type and campus filters.

The browser runs the same search (lib/question-search.ts) so results appear as the student types;
scripts/check-retrieval.ts checks that both give identical results.
"""
import re
import unicodedata

from .catalog import assessment_of, material_for_id, topic_for_id, topics

SEARCH_STOPWORDS = set("a an the and or of to in on for with is are was were what which how explain find show give me question questions about past paper papers please".split())


def normalize_search(text: str) -> str:
    """Lowercase, drop possessive 's, and turn every run of punctuation into one space."""
    text = unicodedata.normalize("NFKC", text).lower()
    text = re.sub(r"[’']s\b", "", text, flags=re.ASCII)
    text = re.sub(r"[\W_]+", " ", text)  # anything that is not a letter or digit
    return re.sub(r"\s+", " ", text.strip())


def search_terms(text: str) -> list[str]:
    """Distinct words worth searching for, in order."""
    words = [word for word in normalize_search(text).split(" ") if word and word not in SEARCH_STOPWORDS]
    return list(dict.fromkeys(words))


def _topic_words(question: dict) -> set[str]:
    """Words from the names and keywords of the question's topics."""
    parts = []
    for topic_id in question["topicIds"]:
        topic = topic_for_id(topic_id)
        parts.append(" ".join([topic["name"], *topic["keywords"]]) if topic else "")
    return set(search_terms(" ".join(parts)))


def _passes_filters(question: dict, topic_ids, assessments, campus_filter) -> bool:
    if topic_ids and not any(topic_id in question["topicIds"] for topic_id in topic_ids):
        return False
    assessment = assessment_of(question)
    if assessments and (assessment is None or assessment not in assessments):
        return False
    campus = (material_for_id(question["materialId"]) or {}).get("campus", "")
    return not campus_filter or campus in campus_filter


# ponytail: lexical ranking cannot understand unseen paraphrases; question_semantic covers those.
def search_questions(bank: list[dict], query: str, topic_ids=(), assessments=(), campus_filter=()) -> list[dict]:
    """Every matching question, best first. Matches in the question's own text rank before topic matches."""
    normalized = normalize_search(query)
    terms = search_terms(query)

    # Topics the query names outright, e.g. "dijkstra" names Graphs, MST & Shortest Paths.
    named_topics = set()
    for topic in topics:
        for alias in [topic["name"], *topic["keywords"]]:
            phrase = normalize_search(alias)
            if phrase and f" {phrase} " in f" {normalized} ":
                named_topics.add(topic["id"])

    scored = []
    for question in bank:
        if not _passes_filters(question, topic_ids, assessments, campus_filter):
            continue
        visuals = [f"{visual['caption']} {visual['description']}" for visual in question.get("visuals", [])]
        text = normalize_search(" ".join([question["text"], *question.get("options", []), *visuals]))
        text_words = set(search_terms(text))
        topic_words = _topic_words(question)

        text_hits = sum(1 for term in terms if term in text_words)
        all_terms_match = bool(terms) and all(term in text_words or term in topic_words for term in terms)
        topic_named = any(topic_id in named_topics for topic_id in question["topicIds"])
        phrase_match = bool(normalized) and f" {normalized} " in f" {text} "

        if normalized and not (all_terms_match or topic_named or phrase_match):
            continue
        score = (100 if phrase_match else 0) + text_hits * 5 + (3 if all_terms_match else 0) + (1 if topic_named else 0)
        scored.append((score, question))

    # Python's sort is stable, so equal scores keep the question bank's order.
    scored.sort(key=lambda item: item[0], reverse=True)
    return [question for score, question in scored]
