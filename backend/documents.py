"""Text extraction from PDF and Word (DOCX) files, used by ingest and by notice uploads."""
import io

import mammoth
import pymupdf


def pdf_pages(data: bytes) -> list[str]:
    """The text of each PDF page, in order. Scanned pages come back (nearly) empty."""
    with pymupdf.open(stream=data, filetype="pdf") as document:
        return [page.get_text() for page in document]


def docx_text(data: bytes) -> str:
    return mammoth.extract_raw_text(io.BytesIO(data)).value
