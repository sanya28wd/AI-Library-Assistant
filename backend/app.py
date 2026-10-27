"""The backend web server: every /api route the website calls.

Run it with:  .venv/bin/uvicorn backend.app:app --port 8000 --reload
The Next.js site (npm run dev) forwards /api/... requests here (see next.config.ts).
Interactive API docs: http://127.0.0.1:8000/docs
"""
import uuid

from fastapi import Body, FastAPI, Query, Request
from fastapi.responses import JSONResponse
from starlette.datastructures import UploadFile

from .catalog import assessment_types, campuses, course_for_id, material_for_id, questions, questions_for_course, topic_for_id
from .documents import docx_text, pdf_pages
from .llm import generate_answer, has_api_key
from .notice import detect_assessment, match_topics
from .question_search import search_questions
from .question_semantic import questions_by_meaning
from .retrieval import hybrid_retrieve, page_source

app = FastAPI(title="AI Library Assistant API")

# FastAPI runs plain `def` routes in a thread pool, so a slow OpenAI call does not hold up other requests.


def error(message: str, status: int) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status)


def available_course(course_id: str) -> dict | None:
    course = course_for_id(course_id)
    return course if course and course["available"] else None


def numbered_sources(sources: list[dict]) -> str:
    """The sources block of a prompt: "[1] Test 2 - 2016-17, page 3" followed by the passage."""
    return "\n\n".join(
        f"[{source['id']}] {source['label']}{', page ' + str(source['page']) if source['page'] else ''}\n{source['excerpt']}"
        for source in sources
    ) or "(no matching passages were found)"


# ---------- Question search ----------

@app.get("/api/questions")
def list_questions(
    course: str | None = None,
    q: str = "",
    topic: list[str] = Query([]),
    assessment: list[str] = Query([]),
    campus: list[str] = Query([]),
):
    """Search reviewed questions by course, topic, assessment type, campus and free text."""
    if any(value not in assessment_types for value in assessment):
        return error("Unknown assessment type.", 400)
    if any(value not in campuses for value in campus):
        return error("Unknown campus.", 400)
    if course and not available_course(course):
        return error("Unknown course.", 404)
    bank = questions_for_course(course) if course else questions
    return {"data": search_questions(bank, q.lower().strip(), topic, assessment, campus)}


@app.get("/api/questions/related")
def related_questions(
    course: str = "",
    q: str = "",
    topic: list[str] = Query([]),
    assessment: list[str] = Query([]),
    campus: list[str] = Query([]),
    exclude: list[str] = Query([]),
):
    """Questions that match a search by meaning rather than wording ("Related by meaning" on the search page)."""
    selected = available_course(course)
    if not selected:
        return error("Unknown course.", 404)
    if any(value not in assessment_types for value in assessment) or any(value not in campuses for value in campus):
        return error("Unknown filter value.", 400)
    # An empty query applies only the filters, so meaning search respects the same topic, exam-type and campus choices.
    filtered = search_questions(questions_for_course(selected["id"]), "", topic, assessment, campus)
    candidates = [question for question in filtered if question["id"] not in exclude]
    return {"data": questions_by_meaning(candidates, q[:300])}


# ---------- Study assistant (chat) ----------

MAX_HISTORY = 8
MAX_MESSAGE_LENGTH = 1500


def chat_instructions(course_label: str, sources: list[dict]) -> str:
    return f"""You are the study assistant for {course_label} in the BITS Pilani Dubai Campus library.

Rules:
- Ground your answer in the numbered course sources below and cite them inline as [1], [2] right after the claim they support.
- Past papers often contain only the question, not its explanation. If your answer explains anything the sources do not state, it MUST begin with the exact line "General explanation (not from your course material):" followed by that explanation without citations. Then add a line starting "In your past papers:" that lists which sources examine the topic and how, with citations, e.g. "Test 2 asked you to trace it with the near array [4]."
- Diagram transcriptions are question inputs, not worked solutions. Use the question number and caption to distinguish graphs on the same page. Do not infer missing edges, directions or weights from OCR fragments.
- If the sources are unrelated to the question, say so plainly and suggest which course topic or paper to look at.
- Formatting: plain text with short paragraphs and "- " bullet lists. You may use **bold** for a few key terms. Write maths in LaTeX, inline as \\( T(n) = \\Theta(n^2) \\) and displayed as \\[ ... \\]. No headings, tables or code blocks.
- When a source is an answer key, you may use it, but encourage the student to attempt the question first.
- Be concise and use plain language a second-year student can follow. Use short paragraphs or bullet points.
- Do not complete graded take-home work or an exam in progress for the student; explain the concept and point to sources instead.

Sources:
{numbered_sources(sources)}"""


@app.post("/api/chat")
def chat(body: dict = Body(...)):
    """Course study assistant: retrieve passages from the ingested papers and answer with citations."""
    course = available_course(str(body.get("courseId") or ""))
    if not course:
        return error("Unknown course.", 404)
    messages = [
        {"role": message["role"], "content": message["content"][:MAX_MESSAGE_LENGTH]}
        for message in body.get("messages") or []
        if isinstance(message, dict) and message.get("role") in ("user", "assistant")
        and isinstance(message.get("content"), str) and message["content"].strip()
    ][-MAX_HISTORY:]
    user_turns = [message["content"] for message in messages if message["role"] == "user"]
    if not user_turns:
        return error("Ask a question first.", 400)

    # Include the previous question so follow-ups like "explain that more simply" still retrieve the right passages.
    sources = hybrid_retrieve(" ".join(user_turns[-2:]), course["id"])

    if not has_api_key():
        answer = (
            "AI answers are not switched on yet (no OPENAI_API_KEY). These are the passages from your course material that best match your question:"
            if sources else
            f"I could not find anything in the {course['code']} papers or handout that matches that. Try naming a topic, algorithm, thinker or concept."
        )
        return {"answer": answer, "sources": sources, "mode": "sources-only"}

    try:
        answer = generate_answer(chat_instructions(f"{course['code']} {course['name']}", sources), messages)
    except Exception:
        return error("The study assistant is unavailable right now.", 502)
    return {"answer": answer or "No answer was returned.", "sources": sources, "mode": "ai"}


# ---------- Explanations for one question ----------

def explanation_instructions(course_label: str, sources: list[dict]) -> str:
    return f"""You explain past exam questions for {course_label} students at the BITS Pilani Dubai Campus library.

Source [1] is the paper page the question comes from; it holds the question's own data, tables and wording. Later sources are related course material, which may include answer keys or marking schemes.

Rules:
- Explain how to approach and solve the question: the idea being tested, the method step by step, and common mistakes. Work through the given data when the sources contain it.
- Cite sources inline as [1], [2] right after the claim they support. Use an answer key or marking scheme when one covers this question, and say so.
- If you explain anything the sources do not state, put it under the exact line "General explanation (not from your course material):" without citations.
- Do not invent numbers, edges, weights or table values that are not in the sources. If the data you need is missing from the extracted text, tell the student to open the source page [1].
- Formatting: plain text with short paragraphs and "- " bullet lists. You may use **bold** for a few key terms. Write maths in LaTeX, inline as \\( x^2 \\) and displayed as \\[ ... \\]. No headings, tables or code blocks.
- Keep it under about 250 words.

Sources:
{numbered_sources(sources)}"""


@app.post("/api/questions/{question_id}/explanation")
def explain_question(question_id: str):
    """A verified answer, or an AI explanation grounded in the question's own page and related course material."""
    question = next((item for item in questions if item["id"] == question_id), None)
    material = question and material_for_id(question["materialId"])
    course = material and course_for_id(material["courseId"])
    if not question or not material or not course:
        return error("Question not found", 404)
    if question["verifiedAnswer"] and question.get("answer"):
        return {"data": question["answer"], "sources": [], "source": "verified-answer-key"}

    # The question's own page first, then related passages from elsewhere in the course.
    own = page_source(material["id"], question["page"])
    topic_names = " ".join((topic_for_id(topic_id) or {}).get("name", "") for topic_id in question["topicIds"])
    related = [source for source in hybrid_retrieve(f"{question['text']} {topic_names}", course["id"], 6) if not (own and source["href"] == own["href"])]
    related = related[:4 if own else 5]
    sources = [{**source, "id": number} for number, source in enumerate([own, *related] if own else related, start=1)]

    prompt = "Question" + (f" ({question['marks']} marks)" if question["marks"] else "") + f": {question['text']}"
    if question.get("options"):
        prompt += "\nOptions: " + "; ".join(f"{chr(65 + index)}. {option}" for index, option in enumerate(question["options"]))

    try:
        data = generate_answer(explanation_instructions(f"{course['code']} {course['name']}", sources), prompt)
    except Exception:
        return error("Unable to generate an explanation right now.", 502)
    if data is None:
        return {"data": "AI explanations are not switched on (no OPENAI_API_KEY). Open the source page to work through the question.", "sources": sources, "source": "configuration"}
    return {"data": data or "No explanation was returned.", "sources": sources, "source": "ai-study-explanation"}


# ---------- Exam notices ----------

MAX_NOTICE_BYTES = 5 * 1024 * 1024


def notice_text(file_name: str, data: bytes) -> str:
    name = file_name.lower()
    if name.endswith(".pdf"):
        return "\n\n".join(pdf_pages(data))
    if name.endswith(".docx"):
        return docx_text(data)
    raise ValueError("Upload a PDF or DOCX notice.")


@app.post("/api/notices/preview")
async def notice_preview(request: Request):
    """Suggest course topics from an uploaded file or pasted text. The notice is read in memory and never saved."""
    if "multipart/form-data" in request.headers.get("content-type", ""):
        form = await request.form()
        file = form.get("file")
        course_id = str(form.get("courseId") or "")
        if not isinstance(file, UploadFile):
            return error("A notice file is required.", 400)
        if (file.size or 0) > MAX_NOTICE_BYTES:
            return error("The notice must be smaller than 5 MB.", 413)
        data = await file.read()
        try:
            text = notice_text(file.filename or "", data)
        except ValueError as problem:
            return error(str(problem), 400)
        except Exception:
            return error("We could not read that file.", 400)
    else:
        try:
            body = await request.json()
        except ValueError:
            body = None
        if not isinstance(body, dict):
            return error("Send a notice file or JSON with text and courseId.", 400)
        text = str(body.get("text") or "")
        course_id = str(body.get("courseId") or "")
    if not available_course(course_id):
        return error("Unknown course.", 404)
    return {"data": match_topics(text, course_id), "assessmentType": detect_assessment(text), "textFound": bool(text.strip()), "persisted": False}


# ---------- Staff placeholders (the admin workflow is not built yet) ----------

@app.post("/api/admin/materials", status_code=202)
async def queue_material(request: Request):
    form = await request.form()
    file = form.get("file")
    if not isinstance(file, UploadFile):
        return error("A source file is required.", 400)
    return {"data": {"id": str(uuid.uuid4()), "fileName": file.filename, "status": "review", "message": "Material queued for extraction and admin review."}}


@app.post("/api/admin/materials/{material_id}/process")
def process_material(material_id: str):
    return {"data": {"id": material_id, "status": "review", "message": "Extraction is configured through backend/ingest.py; review candidates before publication."}}


@app.post("/api/admin/questions/{question_id}/publish")
def publish_question(question_id: str):
    return {"data": {"id": question_id, "status": "published"}}
