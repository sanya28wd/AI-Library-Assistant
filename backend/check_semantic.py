"""Measures keyword-only vs hybrid (keyword + meaning) retrieval on paraphrased questions that avoid the paper's own terms.

Run after embed:  .venv/bin/python -m backend.check_semantic   (needs OPENAI_API_KEY)
"""
import re

from .llm import has_api_key
from .retrieval import hybrid_retrieve, retrieve

# `relevant` marks a passage that really covers the concept; each query deliberately avoids those words.
CASES = [
    ("cs-f364", "how should I choose the dividing element so this sorting method is fastest or slowest", r"pivot"),
    ("cs-f364", "connect every vertex using the cheapest total set of links without cycles", r"spanning tree|prim|kruskal"),
    ("cs-f364", "give frequent characters shorter bit codes to compress a message", r"huffman"),
    ("cs-f364", "place pieces on a chessboard so that none of them can attack each other", r"queen"),
    ("cs-f364", "push as much water as possible through pipes from a source to a sink", r"flow|residual"),
    ("bits-f464", "my model does great on the data it learned from but badly on new data", r"overfit|variance"),
    ("bits-f464", "split customers into groups when we have no labels", r"k-means|kmeans|cluster"),
    ("bits-f464", "shrink the number of features while keeping most of the information", r"principal component|pca|dimensionality|discriminant"),
    ("bits-f464", "combine many weak learners so together they become a strong one", r"boost|ensemble|random forest|bagging"),
    ("bits-f464", "an agent learns by trial and error from rewards and penalties", r"q-learning|q learning|reinforcement|reward"),
    ("gs-f211", "the extra value workers create that the employer keeps instead of paying them", r"surplus value"),
    ("gs-f211", "a regime that controls newspapers and blames minorities to stay in power", r"fascis|propaganda"),
    ("gs-f211", "everyone gets a fixed monthly payment from the government whether or not they work", r"ubi|basic income"),
    ("gs-f211", "should the state stay out of the economy and let markets run themselves", r"laissez|liberal|market|night watchman"),
    ("gs-f211", "how men's dominance over women is built into society", r"patriarch|feminis"),
]


def rank_of_first_hit(sources: list[dict], relevant: str) -> int | None:
    """1-based position of the first relevant passage, or None when none was returned."""
    for position, source in enumerate(sources, start=1):
        if re.search(relevant, source["excerpt"], re.IGNORECASE):
            return position
    return None


def main() -> None:
    assert has_api_key(), "Set OPENAI_API_KEY in .env.local; meaning search needs it for query embeddings."
    keyword_hits = hybrid_hits = 0
    keyword_reciprocal = hybrid_reciprocal = 0.0
    for course, query, relevant in CASES:
        keyword = rank_of_first_hit(retrieve(query, course, 6), relevant)
        hybrid = rank_of_first_hit(hybrid_retrieve(query, course, 6), relevant)
        keyword_hits += keyword is not None
        hybrid_hits += hybrid is not None
        keyword_reciprocal += 1 / keyword if keyword else 0
        hybrid_reciprocal += 1 / hybrid if hybrid else 0
        print(f"{f'#{keyword}' if keyword else 'miss':5} → {f'#{hybrid}' if hybrid else 'miss':5} {course}  {query}")
    total = len(CASES)
    print(f"\nHit@6: keyword {keyword_hits}/{total}, hybrid {hybrid_hits}/{total}")
    print(f"MRR@6: keyword {keyword_reciprocal / total:.2f}, hybrid {hybrid_reciprocal / total:.2f}")

    unrelated = hybrid_retrieve("what is the best pizza place near the campus", "cs-f364", 6)
    print(f"Unrelated question returned {len(unrelated)} passages.")
    assert hybrid_hits >= keyword_hits, "Hybrid retrieval must not find fewer relevant passages than keywords alone"


if __name__ == "__main__":
    main()
