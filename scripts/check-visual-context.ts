import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { searchQuestions } from "../lib/question-search";
import { retrieve } from "../lib/retrieval";
import { materialForId, questions, questionsForCourse, sourcePath } from "../lib/seed";
import { ChatResponse, Question } from "../lib/types";

const graphIds: string[] = ["d-9", "d-10", "d-15"];

async function check(): Promise<void> {
  const serverUrl = process.argv[2];
  assert.ok(serverUrl, "Pass the running app URL.");
  const cases: { query: string; id: string }[] = [
    { query: "undirected weighted graph", id: "d-9" },
    { query: "arrowheads opposite arcs", id: "d-10" },
    { query: "source a sink g capacities", id: "d-15" }
  ];
  assert.ok(!searchQuestions(questionsForCourse("cs-f364"), "directed", [], []).some((question) => question.id === "d-9"), "Directed must not match the substring inside undirected");
  for (const item of cases) {
    assert.equal(searchQuestions(questionsForCourse("cs-f364"), item.query, [], [])[0]?.id, item.id, "Retrieve diagram-only context");
    const sources = retrieve(item.query, "cs-f364", 6);
    assert.ok(sources[0]?.visuals?.length, "Passage retrieval must carry the source image");
    const visual = questions.find((question) => question.id === item.id)?.visuals?.[0];
    assert.ok(visual);
    assert.ok(sources[0].visuals?.some((entry) => entry.caption === visual.caption), "Keep same-page diagrams tied to the right question");
    assert.ok(sources[0].excerpt.includes(visual.description), "Pass the graph input transcription as answer context");
    assert.equal(retrieve(item.query, "gs-f211", 6).filter((source) => source.visuals?.length).length, 0, "Do not cross course boundaries");
  }
  for (const id of graphIds) {
    const question = questions.find((item) => item.id === id);
    assert.ok(question, `Missing question ${id}`);
    assert.equal(question.visuals?.length, 1, `${id} must retain its graph image and context`);
    const material = materialForId(question.materialId);
    assert.ok(material && material.kind === "paper");
    for (const visual of question.visuals ?? []) {
      assert.equal(visual.page, question.page, "Graph context must cite its question's physical PDF page");
      assert.ok(visual.description.length > 100, "Include graph direction, labels and input values");
      const bytes = await readFile(join(process.cwd(), "public", "materials", visual.fileName));
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      const response = await fetch(new URL(sourcePath(visual.fileName), serverUrl));
      assert.equal(response.status, 200, "Source image must be available to the student");
      assert.ok(response.headers.get("content-type")?.includes("image/png"));
    }
    const response = await fetch(new URL(`/api/questions?course=cs-f364&q=${id === "d-15" ? "bottleneck" : "graph"}`, serverUrl));
    assert.equal(response.status, 200);
    const payload = await response.json() as { data: Question[] };
    assert.deepEqual(payload.data.find((item) => item.id === id)?.visuals, question.visuals, "API must retain image provenance");
  }
  const chat = await fetch(new URL("/api/chat", serverUrl), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId: "cs-f364", messages: [{ role: "user", content: "Find the question with arrowheads and opposite arcs." }] })
  });
  assert.equal(chat.status, 200);
  const turn = await chat.json() as ChatResponse;
  assert.ok(turn.sources[0]?.visuals?.[0]?.caption.includes("Question 2"), "Chat must expose the matching diagram");
  assert.ok(turn.sources[0].excerpt.includes("4→2 (4)"), "Chat's source context must retain directional costs");
  const directed = questions.find((item) => item.id === "d-10")?.visuals?.[0];
  assert.ok(directed?.description.includes("4→2 (4)") && directed.description.includes("2→4 (9)"), "Opposite arcs have different costs");
  const flow = questions.find((item) => item.id === "d-15")?.visuals?.[0];
  assert.ok(flow?.description.includes("source a") && flow.description.includes("sink g"));
  console.log(`Passed three diagram-context retrieval cases, image provenance and delivery, graph input sentinels, course isolation and live question/chat API checks (chat mode: ${turn.mode}).`);
}

void check();
