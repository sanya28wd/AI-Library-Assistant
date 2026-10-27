"""Checks that diagram questions keep their original page image and graph transcription end to end.

Run with the site running (npm run dev, plus the backend):
    .venv/bin/python -m backend.check_visual_context http://127.0.0.1:3000
"""
import json
import sys
import urllib.request
from urllib.parse import urljoin

from .catalog import PROJECT_ROOT, material_for_id, questions, questions_for_course, source_path
from .question_search import search_questions
from .retrieval import retrieve

GRAPH_IDS = ["d-9", "d-10", "d-15"]


def fetch(url: str, body: dict | None = None):
    """GET (or POST JSON when `body` is given); returns (status, content type, response bytes)."""
    request = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request) as response:
        return response.status, response.headers.get("content-type", ""), response.read()


def question(question_id: str) -> dict:
    return next(item for item in questions if item["id"] == question_id)


def main(server_url: str) -> None:
    daa = questions_for_course("cs-f364")
    assert not any(item["id"] == "d-9" for item in search_questions(daa, "directed")), "Directed must not match the substring inside undirected"

    for query, question_id in [("undirected weighted graph", "d-9"), ("arrowheads opposite arcs", "d-10"), ("source a sink g capacities", "d-15")]:
        assert search_questions(daa, query)[0]["id"] == question_id, "Retrieve diagram-only context"
        sources = retrieve(query, "cs-f364", 6)
        assert sources and sources[0].get("visuals"), "Passage retrieval must carry the source image"
        visual = question(question_id)["visuals"][0]
        assert any(entry["caption"] == visual["caption"] for entry in sources[0]["visuals"]), "Keep same-page diagrams tied to the right question"
        assert visual["description"] in sources[0]["excerpt"], "Pass the graph input transcription as answer context"
        assert not [source for source in retrieve(query, "gs-f211", 6) if source.get("visuals")], "Do not cross course boundaries"

    for question_id in GRAPH_IDS:
        item = question(question_id)
        assert len(item.get("visuals", [])) == 1, f"{question_id} must retain its graph image and context"
        material = material_for_id(item["materialId"])
        assert material and material["kind"] == "paper"
        for visual in item["visuals"]:
            assert visual["page"] == item["page"], "Graph context must cite its question's physical PDF page"
            assert len(visual["description"]) > 100, "Include graph direction, labels and input values"
            image = (PROJECT_ROOT / "public" / "materials" / visual["fileName"]).read_bytes()
            assert image[1:4] == b"PNG"
            status, content_type, _ = fetch(urljoin(server_url, source_path(visual["fileName"])))
            assert status == 200, "Source image must be available to the student"
            assert "image/png" in content_type
        status, _, raw = fetch(urljoin(server_url, f"/api/questions?course=cs-f364&q={'bottleneck' if question_id == 'd-15' else 'graph'}"))
        assert status == 200
        found = next((entry for entry in json.loads(raw)["data"] if entry["id"] == question_id), {})
        assert found.get("visuals") == item["visuals"], "API must retain image provenance"

    status, _, raw = fetch(urljoin(server_url, "/api/chat"), {"courseId": "cs-f364", "messages": [{"role": "user", "content": "Find the question with arrowheads and opposite arcs."}]})
    assert status == 200
    turn = json.loads(raw)
    assert "Question 2" in turn["sources"][0]["visuals"][0]["caption"], "Chat must expose the matching diagram"
    assert "4→2 (4)" in turn["sources"][0]["excerpt"], "Chat's source context must retain directional costs"
    directed = question("d-10")["visuals"][0]["description"]
    assert "4→2 (4)" in directed and "2→4 (9)" in directed, "Opposite arcs have different costs"
    flow = question("d-15")["visuals"][0]["description"]
    assert "source a" in flow and "sink g" in flow
    print(f"Passed three diagram-context retrieval cases, image provenance and delivery, graph input sentinels, course isolation and live question/chat API checks (chat mode: {turn['mode']}).")


if __name__ == "__main__":
    assert len(sys.argv) > 1, "Pass the running app URL, e.g. python -m backend.check_visual_context http://127.0.0.1:3000"
    main(sys.argv[1])
