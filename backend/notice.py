"""Reads an exam notice and suggests which course topics and exam type it is about.

The browser has its own copy (lib/notice.ts) for the GitHub Pages demo, where there is no server.
"""
import re

from .catalog import topics_for_course


def match_topics(text: str, course_id: str) -> list[dict]:
    """Topics whose keywords appear in the text. Keywords match at the start of a word, so "prims" does not fire inside "primary"."""
    normalized = text.lower()
    return [
        topic for topic in topics_for_course(course_id)
        if any(re.search(r"(^|[^a-z0-9])" + re.escape(keyword), normalized) for keyword in topic["keywords"])
    ]


def detect_assessment(text: str) -> str | None:
    """A notice is about one exam, so the earliest mention wins: "COMPREHENSIVE EXAM NOTICE" may still refer back to the mid-sem."""
    normalized = text.lower()
    patterns = [
        ("Comprehensive", r"compre"),
        ("Mid-semester", r"mid[\s-]*(sem|term)"),
        ("Test", r"\btest[\s-]*(1|2|i|ii)\b"),
        ("Quiz", r"quiz"),
    ]
    found = [(match.start(), name) for name, pattern in patterns if (match := re.search(pattern, normalized))]
    if not found:
        return None
    return min(found, key=lambda item: item[0])[1]
