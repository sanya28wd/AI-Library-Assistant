import assert from "node:assert/strict";
import { searchQuestions } from "../lib/question-search";
import { assessmentOf, materialForId, questionsForCourse } from "../lib/seed";
import { nudgesForQuestion } from "../lib/study-nudges";
import { AssessmentType } from "../lib/types";

type RetrievalCase = { course: string; query: string; firstId: string };
const cases: RetrievalCase[] = [
  { course: "cs-f364", query: "worst quicksort", firstId: "d-6" },
  { course: "cs-f364", query: "LCS", firstId: "d-4" },
  { course: "cs-f364", query: "Prim’s algorithm", firstId: "d-9" },
  { course: "cs-f364", query: "0/1 knapsack", firstId: "d-3" },
  { course: "gs-f211", query: "Rawls", firstId: "q-2" },
  { course: "gs-f211", query: "G. A. Cohen", firstId: "q-3" }
];

async function check(): Promise<void> {
  const serverUrl = process.argv[2];
  assert.ok(serverUrl, "Pass the running app URL, e.g. npm run check:retrieval -- http://127.0.0.1:3000");
  for (const { course, query, firstId } of cases) {
    const bank = questionsForCourse(course);
    const before = JSON.stringify(bank);
    const results = searchQuestions(bank, query, [], []);
    assert.equal(results[0]?.id, firstId, `First result for ${query}`);
    assert.equal(JSON.stringify(bank), before, "Search must not mutate question data");
    const url = new URL("/api/questions", serverUrl);
    url.searchParams.set("course", course);
    url.searchParams.set("q", query);
    const response = await fetch(url);
    assert.equal(response.status, 200);
    const payload = await response.json() as { data: { id: string }[] };
    assert.deepEqual(payload.data.map((item) => item.id), results.map((item) => item.id), `Client/API parity for ${query}`);
  }
  const bank = questionsForCourse("cs-f364");
  assert.equal(searchQuestions(bank, "gobbledygook", [], []).length, 0);
  assert.deepEqual(searchQuestions(bank, "", [], []).map((item) => item.id), bank.map((item) => item.id));
  const assessments: AssessmentType[] = ["Test"];
  const expected = bank.filter((item) => item.topicIds.includes("graphs") && assessmentOf(item) === "Test");
  const filtered = searchQuestions(bank, "", ["graphs"], assessments);
  assert.deepEqual(filtered.map((item) => item.id), expected.map((item) => item.id), "All matching filtered questions must be returned");
  assert.ok(filtered.every((item) => materialForId(item.materialId)?.courseId === "cs-f364"));
  for (const question of [...bank, ...questionsForCourse("gs-f211")]) {
    const nudges = nudgesForQuestion(question);
    assert.equal(nudges.length, 3);
    assert.ok(nudges.every((nudge) => nudge.trim().length > 0));
    const answer = question.answer;
    if (answer) assert.ok(nudges.every((nudge) => !nudge.includes(answer)), "Do not copy answer-key text into a nudge");
  }
  const invalid = new URL("/api/questions?assessment=Invalid", serverUrl);
  assert.equal((await fetch(invalid)).status, 400);
  console.log(`Passed ${cases.length} retrieval cases, live API parity, exact filtered enumeration, no-match, input immutability and nudge structure. Hint quality and leakage still require human review.`);
}

void check();
