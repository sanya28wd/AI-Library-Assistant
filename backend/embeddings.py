"""Meaning search: turns text into vectors (lists of numbers) and compares them.

Two texts with similar meaning get vectors pointing in a similar direction. `python -m backend.embed`
stores a vector for every passage and question in data/embeddings.json; at search time only the
student's query is sent to OpenAI.
"""
import base64
import hashlib
import math
from array import array
from functools import lru_cache

from .catalog import DATA, file_version, read_json
from .llm import client, has_api_key

# 512 dimensions keeps data/embeddings.json small; text-embedding-3-small loses little quality at this size.
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 512
EMBEDDINGS_FILE = DATA / "embeddings.json"

Vector = array  # array("f", ...): 32-bit floats, the same format the file stores


def text_key(text: str) -> str:
    """Stable key for a piece of text, so unchanged passages keep their stored vector across runs."""
    return hashlib.sha1(text.encode("utf-8")).hexdigest()


def normalize(vector: list[float]) -> Vector:
    """Scale to length 1, so a plain dot product gives the cosine similarity."""
    length = math.hypot(*vector) or 1
    return array("f", (value / length for value in vector))


def encode_vector(vector: Vector) -> str:
    return base64.b64encode(vector.tobytes()).decode("ascii")


def decode_vector(encoded: str) -> Vector:
    return array("f", base64.b64decode(encoded))


def cosine(a: Vector, b: Vector) -> float:
    """Similarity from -1 (opposite) to 1 (same meaning). Vectors are unit length, so this is the dot product."""
    return sum(x * y for x, y in zip(a, b))


def embed_texts(texts: list[str]) -> list[Vector]:
    """Calls the OpenAI embeddings API, 100 texts per request. Raises when no key is configured or the call fails."""
    if not has_api_key():
        raise RuntimeError("OPENAI_API_KEY is not set")
    vectors = []
    for start in range(0, len(texts), 100):
        response = client().embeddings.create(model=EMBEDDING_MODEL, dimensions=EMBEDDING_DIMENSIONS, input=texts[start:start + 100])
        for item in sorted(response.data, key=lambda item: item.index):
            vectors.append(normalize(item.embedding))
    return vectors


def stored_vectors() -> dict[str, Vector]:
    """Stored vectors keyed by text_key(); empty when embed has not been run. Reloaded when the file changes."""
    return _decoded_vectors(file_version(EMBEDDINGS_FILE))


@lru_cache(maxsize=1)
def _decoded_vectors(version: float | None) -> dict[str, Vector]:
    store = read_json(EMBEDDINGS_FILE)
    # Vectors from a different model or size cannot be compared with new queries, so they are ignored.
    if not store or store["model"] != EMBEDDING_MODEL or store["dimensions"] != EMBEDDING_DIMENSIONS:
        return {}
    return {key: decode_vector(value) for key, value in store["vectors"].items()}


def embed_query(query: str) -> Vector | None:
    """Embeds a search query, remembering the 500 most recent; None when embeddings are unavailable."""
    if not has_api_key() or not stored_vectors():
        return None
    try:
        return _embed_one(query)
    except Exception:
        return None


@lru_cache(maxsize=500)  # thread-safe, and failed calls are not cached
def _embed_one(query: str) -> Vector:
    return embed_texts([query])[0]
