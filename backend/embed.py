"""Step 2 of the data pipeline: create the meaning-search data. Run after ingest.

Run:  .venv/bin/python -m backend.embed   (needs OPENAI_API_KEY in .env.local)

1. Writes a plain-language profile for each curated question that lacks one (data/question-profiles.json).
2. Embeds every passage and question view (data/embeddings.json). Only new or changed texts are sent,
   so re-runs are quick and cheap; vectors for texts that no longer exist are dropped.
"""
import sys

from .catalog import course_for_id, material_for_id, questions, topic_for_id, write_json
from .embeddings import EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, EMBEDDINGS_FILE, embed_texts, encode_vector, stored_vectors, text_key
from .llm import generate_answer
from .question_semantic import PROFILES_FILE, profile_key, question_profiles, question_views
from .retrieval import passage_texts

PROFILE_INSTRUCTIONS = """You help a university library search engine match students' wording to past exam questions.
Given one exam question, write plain text with no headings:
1. Two short sentences on the concept or skill it tests, spelling out every abbreviation and naming the standard method.
2. Four different ways a student might ask about this topic in their own words, one per line, starting with "- ".
Do not answer or solve the question."""


def describe(question: dict) -> str:
    """The question with its options lettered A., B., ..."""
    options = [f"{chr(65 + index)}. {option}" for index, option in enumerate(question.get("options", []))]
    return "\n".join([question["text"], *options])


def write_profiles() -> None:
    profiles = dict(question_profiles())
    missing = [question for question in questions if not profiles.get(profile_key(question))]
    print(f"{len(questions)} questions; writing {len(missing)} new profiles.")
    for question in missing:
        course = course_for_id((material_for_id(question["materialId"]) or {}).get("courseId", "")) or {}
        topic_names = ", ".join(topic["name"] for topic_id in question["topicIds"] if (topic := topic_for_id(topic_id)))
        prompt = f"Course: {course.get('code')} {course.get('name')}\nTopics: {topic_names}\nQuestion: {describe(question)}"
        profile = generate_answer(PROFILE_INSTRUCTIONS, prompt)
        if not profile:
            raise RuntimeError("OPENAI_API_KEY is not set")
        profiles[profile_key(question)] = profile.strip()
    # Drop profiles for questions that were edited or removed.
    current = {profile_key(question) for question in questions}
    profiles = {key: value for key, value in profiles.items() if key in current}
    write_json(PROFILES_FILE, profiles, indent=2)


def write_embeddings() -> None:
    texts = list(dict.fromkeys([*passage_texts(), *(view for question in questions for view in question_views(question))]))
    existing = stored_vectors()
    missing = [text for text in texts if text_key(text) not in existing]
    print(f"{len(texts)} texts; {len(texts) - len(missing)} already embedded; embedding {len(missing)}.")
    fresh = dict(zip((text_key(text) for text in missing), embed_texts(missing) if missing else []))
    vectors = {text_key(text): encode_vector(existing.get(text_key(text)) or fresh[text_key(text)]) for text in texts}
    store = {"model": EMBEDDING_MODEL, "dimensions": EMBEDDING_DIMENSIONS, "vectors": vectors}
    write_json(EMBEDDINGS_FILE, store, separators=(",", ":"))
    print(f"Wrote {len(texts)} vectors to data/embeddings.json.")


def main() -> None:
    write_profiles()
    write_embeddings()


if __name__ == "__main__":
    try:
        main()
    except Exception as problem:
        sys.exit(str(problem))
