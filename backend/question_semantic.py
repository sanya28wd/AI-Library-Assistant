"""Finds curated questions by meaning, for the "Related by meaning" section of the search page."""
from functools import lru_cache

from .catalog import DATA, file_version, read_json, topic_for_id
from .embeddings import cosine, embed_query, stored_vectors, text_key

# Calibrated on paraphrased and unrelated searches: unrelated ones scored at most 0.22, intended questions 0.30 or more.
MINIMUM_QUESTION_SIMILARITY = 0.28

PROFILES_FILE = DATA / "question-profiles.json"


def question_profiles() -> dict[str, str]:
    """Plain-language profiles written by embed (what each question tests and how a student might ask about it),
    keyed by profile_key(). They let meaning search match wording the question never uses, such as "UBI"."""
    return _profiles(file_version(PROFILES_FILE))


@lru_cache(maxsize=1)
def _profiles(version: float | None) -> dict[str, str]:
    return read_json(PROFILES_FILE) or {}


def profile_key(question: dict) -> str:
    return text_key("\n".join([question["text"], *question.get("options", [])]))


def question_views(question: dict) -> list[str]:
    """The short texts embedded for one question: its wording (with options, diagram captions and topics),
    the profile's concept summary, and each profile phrasing on its own. A question scores as its
    best-matching view, so a short student query is compared with short texts instead of one long diluted one."""
    topic_names = ", ".join((topic_for_id(topic_id) or {}).get("name", "") for topic_id in question["topicIds"])
    core = "\n".join([
        question["text"],
        *question.get("options", []),
        *(visual["caption"] for visual in question.get("visuals", [])),
        f"Topics: {topic_names}",
    ])
    lines = question_profiles().get(profile_key(question), "").split("\n")
    phrasings = [line.strip()[2:].strip() for line in lines if line.strip().startswith("- ")]
    summary = " ".join(line for line in lines if line.strip() and not line.strip().startswith("- ")).strip()
    return [view for view in [core, summary, *phrasings] if view]


def questions_by_meaning(bank: list[dict], query: str, limit: int = 5) -> list[dict]:
    """Questions from `bank` that match the query by meaning, best first; empty when embeddings are unavailable."""
    if not query.strip():
        return []
    vector = embed_query(query)
    if vector is None:
        return []
    vectors = stored_vectors()
    scored = []
    for question in bank:
        similarity = max([-1] + [cosine(vector, vectors[text_key(view)]) for view in question_views(question) if text_key(view) in vectors])
        if similarity >= MINIMUM_QUESTION_SIMILARITY:
            scored.append((similarity, question))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [question for similarity, question in scored[:limit]]
