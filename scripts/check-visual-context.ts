import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { materialForId, questions, sourcePath } from "../lib/seed";
import { Question } from "../lib/types";

const graphIds: string[] = ["d-9", "d-10", "d-15"];

async function check(): Promise<void> {
  const serverUrl = process.argv[2];
  assert.ok(serverUrl, "Pass the running app URL.");
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
  const directed = questions.find((item) => item.id === "d-10")?.visuals?.[0];
  assert.ok(directed?.description.includes("4→2 (4)") && directed.description.includes("2→4 (9)"), "Opposite arcs have different costs");
  const flow = questions.find((item) => item.id === "d-15")?.visuals?.[0];
  assert.ok(flow?.description.includes("source a") && flow.description.includes("sink g"));
  console.log("Passed graph image provenance, PNG delivery, graph input sentinels and API context checks for three questions.");
}

void check();
