"""Step 1 of the data pipeline: extract the text of every source file.

Run:  .venv/bin/python -m backend.ingest

Walks papers/, "course handout /" and "exam notices /" (the trailing spaces are part of the folder
names), reads each PDF page by page and each DOCX whole, and writes data/ingested-materials.json.
Scanned pages with no text layer are read with OCR when `tesseract` is installed (brew install tesseract);
OCR results are cached in data/ocr-cache/ by file hash, so each file is only OCR'd once.
"""
import hashlib
import re
import shutil
import subprocess

import pymupdf

from .catalog import DATA, PROJECT_ROOT, read_json, write_json
from .documents import docx_text, pdf_pages

SOURCE_FOLDERS = ["papers", "course handout ", "exam notices "]
OCR_CACHE = DATA / "ocr-cache"
# A page with less text than this is treated as a scan.
MINIMUM_PAGE_TEXT = 40

CAN_OCR = shutil.which("tesseract") is not None


def source_type(folder: str) -> str:
    if folder == "papers":
        return "paper-or-answer-key"
    if "handout" in folder:
        return "handout"
    return "notice-fixture"


def ocr_pages(file_path, sha256: str, page_numbers: list[int]) -> dict[str, str]:
    """OCR text for the given pages, keyed by page number as a string ("1", "2", ...)."""
    cache_path = OCR_CACHE / f"{sha256}.json"
    cached = read_json(cache_path) or {}
    missing = [page for page in page_numbers if str(page) not in cached]
    if not missing or not CAN_OCR:
        return cached
    with pymupdf.open(file_path) as document:
        for page in missing:
            image = document[page - 1].get_pixmap(dpi=200).tobytes("png")
            # --psm 1 detects page orientation, which matters for papers scanned sideways.
            result = subprocess.run(["tesseract", "stdin", "stdout", "--psm", "1", "-l", "eng"], input=image, capture_output=True)
            cached[str(page)] = re.sub(r"\n\s*\n+", "\n", result.stdout.decode("utf-8")).strip() if result.returncode == 0 else ""
    OCR_CACHE.mkdir(exist_ok=True)
    write_json(cache_path, cached, indent=2)
    return cached


def extract(file_path, extension: str, data: bytes, sha256: str) -> tuple[list[str] | None, str, list[int]]:
    """Returns (pages, full text, pages that were OCR'd). DOCX files have no pages, so pages is None."""
    if extension == ".docx":
        return None, docx_text(data), []
    pages = pdf_pages(data)
    scanned = [number for number, text in enumerate(pages, start=1) if len(text.strip()) < MINIMUM_PAGE_TEXT]
    recognised = ocr_pages(file_path, sha256, scanned) if scanned else {}
    ocr_applied = [page for page in scanned if len(recognised.get(str(page), "").strip()) >= MINIMUM_PAGE_TEXT]
    for page in ocr_applied:
        pages[page - 1] = recognised[str(page)]
    return pages, "\n\n".join(pages), ocr_applied


def list_files(folder) -> list:
    """Every file under `folder`, skipping hidden files and folders such as .DS_Store."""
    files = []
    for entry in folder.iterdir():
        if entry.name.startswith("."):
            continue
        if entry.is_dir():
            files += list_files(entry)
        elif entry.is_file():
            files.append(entry)
    return files


def ingest_folder(folder: str) -> list[dict]:
    full_path = PROJECT_ROOT / folder
    if not full_path.exists():
        return []
    files = sorted((path for path in list_files(full_path) if path.suffix.lower() in (".pdf", ".docx")), key=str)
    materials = []
    for file_path in files:
        extension = file_path.suffix.lower()
        data = file_path.read_bytes()
        sha256 = hashlib.sha256(data).hexdigest()
        pages, text, ocr_applied = extract(file_path, extension, data, sha256)
        relative_path = file_path.relative_to(PROJECT_ROOT).as_posix()
        if ocr_applied:
            print(f"OCR: {relative_path} (pages {', '.join(map(str, ocr_applied))})")
        materials.append({
            "fileName": file_path.name,
            "relativePath": relative_path,
            "sourceDirectory": source_type(folder),
            "extension": extension,
            "sha256": sha256,
            "characterCount": len(text.strip()),
            "text": text,
            "pages": pages,
            "ocrPages": ocr_applied,
            "requiresOcr": pages is not None and any(len(page.strip()) < MINIMUM_PAGE_TEXT for page in pages),
        })
    return materials


def main(output=DATA / "ingested-materials.json") -> None:
    if not CAN_OCR:
        print("tesseract not found: scanned PDF pages will be flagged for OCR review instead of read.")
    result = [material for folder in SOURCE_FOLDERS for material in ingest_folder(folder)]
    write_json(output, result, indent=2)
    flagged = sum(1 for material in result if material["requiresOcr"])
    print(f"Prepared {len(result)} source files for admin review" + (f"; {flagged} still have unreadable pages" if flagged else "") + ".")
    print("Next: run `python -m backend.embed` so meaning search covers the new or changed passages.")


if __name__ == "__main__":
    main()
