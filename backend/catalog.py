"""Course data: courses, topics, papers (materials) and curated questions.

Everything is loaded from data/catalog.json. The website reads the same file through lib/seed.ts,
so the backend and the browser always agree. Records stay plain dictionaries with the JSON's own
field names (camelCase), so API responses can return them unchanged.
"""
import json
import os
from pathlib import Path
from urllib.parse import quote

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA = PROJECT_ROOT / "data"

_catalog = json.loads((DATA / "catalog.json").read_text(encoding="utf-8"))
courses: list[dict] = _catalog["courses"]
campuses: list[str] = _catalog["campuses"]
assessment_types: list[str] = _catalog["assessmentTypes"]
topics: list[dict] = _catalog["topics"]
materials: list[dict] = _catalog["materials"]
questions: list[dict] = _catalog["questions"]


def topic_for_id(topic_id: str) -> dict | None:
    return next((topic for topic in topics if topic["id"] == topic_id), None)


def material_for_id(material_id: str) -> dict | None:
    return next((material for material in materials if material["id"] == material_id), None)


def course_for_id(course_id: str) -> dict | None:
    return next((course for course in courses if course["id"] == course_id), None)


def topics_for_course(course_id: str) -> list[dict]:
    return [topic for topic in topics if topic["courseId"] == course_id]


def questions_for_course(course_id: str) -> list[dict]:
    return [question for question in questions if (material_for_id(question["materialId"]) or {}).get("courseId") == course_id]


def source_path(file_name: str) -> str:
    """URL of a file under public/materials. `safe` matches JavaScript's encodeURIComponent, so links are identical."""
    return "/materials/" + "/".join(quote(part, safe="!*'()") for part in file_name.split("/"))


def section_at(material: dict, page: int) -> dict | None:
    """The exam a page belongs to, for files that bundle several exams (sections are listed in page order)."""
    started = [section for section in material.get("sections", []) if section["startPage"] <= page]
    return started[-1] if started else None


def assessment_of(question: dict) -> str | None:
    material = material_for_id(question["materialId"])
    if material is None:
        return None
    section = section_at(material, question["page"])
    return section["assessmentType"] if section else material["assessmentType"]


def exam_label(material: dict, page: int | None = None) -> str:
    """"Test 2 - 2016-17 Second Semester", naming the exam on that page when the file bundles several."""
    sections = material.get("sections", [])
    exam = section_at(material, page) if page else None
    if exam is None and len(sections) == 1:
        exam = sections[0]
    name = exam["label"] if exam else (material["assessmentType"] or "Paper")
    session = f" {material['session']}" if material.get("session") else ""
    return f"{name} - {material['year']}{session}"


def file_version(path: Path) -> float | None:
    """Last-modified time of a data file, or None when it is missing.

    Loaders cache on this value with @lru_cache(maxsize=1), so re-running ingest or embed refreshes
    the data without restarting the server.
    """
    try:
        return path.stat().st_mtime
    except FileNotFoundError:
        return None


def read_json(path: Path):
    """The parsed JSON file, or None when it is missing."""
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def write_json(path: Path, data, **options) -> None:
    """Writes to a temporary file, then swaps it in, so the running server never reads a half-written file."""
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, **options), encoding="utf-8")
    os.replace(temporary, path)
