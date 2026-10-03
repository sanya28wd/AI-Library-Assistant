// Creates meaning-search data: `npm run embed` (after `npm run ingest`).
// 1. Writes a plain-language profile for each curated question that lacks one (data/question-profiles.json).
// 2. Embeds every passage and question; only new or changed texts are sent, and stale vectors are dropped.
import { writeFileSync } from "node:fs";
import { EmbeddingStore, embeddingDimensions, embeddingModel, embeddingsFile, embedTexts, encodeVector, storedVectors, textKey } from "../lib/embeddings";
import { generateAnswer } from "../lib/openai";
import { profileKey, profilesFile, questionProfiles, questionViews } from "../lib/question-semantic";
import { passageTexts } from "../lib/retrieval";
import { courseForId, materialForId, questions, topicForId } from "../lib/seed";
import { Question } from "../lib/types";

const profileInstructions = `You help a university library search engine match students' wording to past exam questions.
Given one exam question, write plain text with no headings:
1. Two short sentences on the concept or skill it tests, spelling out every abbreviation and naming the standard method.
2. Four different ways a student might ask about this topic in their own words, one per line, starting with "- ".
Do not answer or solve the question.`;

async function writeProfiles(): Promise<void> {
  const profiles = { ...questionProfiles() };
  const current = new Set(questions.map(profileKey));
  const missing = questions.filter((question) => !profiles[profileKey(question)]);
  console.log(`${questions.length} questions; writing ${missing.length} new profiles.`);
  for (const question of missing) {
    const course = courseForId(materialForId(question.materialId)?.courseId ?? "");
    const topics = question.topicIds.map((id) => topicForId(id)?.name).filter(Boolean).join(", ");
    const profile = await generateAnswer(profileInstructions, `Course: ${course?.code} ${course?.name}\nTopics: ${topics}\nQuestion: ${describe(question)}`);
    if (!profile) throw new Error("OPENAI_API_KEY is not set");
    profiles[profileKey(question)] = profile.trim();
  }
  // Drop profiles for questions that were edited or removed.
  for (const key of Object.keys(profiles)) if (!current.has(key)) delete profiles[key];
  writeFileSync(profilesFile, `${JSON.stringify(profiles, null, 2)}\n`);
}

function describe(question: Question): string {
  return [question.text, ...(question.options ?? []).map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)].join("\n");
}

async function writeEmbeddings(): Promise<void> {
  const texts = [...new Set([...passageTexts(), ...questions.flatMap(questionViews)])];
  const existing = storedVectors();
  const missing = texts.filter((text) => !existing.has(textKey(text)));
  console.log(`${texts.length} texts; ${texts.length - missing.length} already embedded; embedding ${missing.length}.`);
  const fresh = new Map<string, Float32Array>();
  const vectors = missing.length > 0 ? await embedTexts(missing) : [];
  missing.forEach((text, index) => fresh.set(textKey(text), vectors[index]));
  const store: EmbeddingStore = { model: embeddingModel, dimensions: embeddingDimensions, vectors: {} };
  for (const text of texts) {
    const key = textKey(text);
    store.vectors[key] = encodeVector((existing.get(key) ?? fresh.get(key))!);
  }
  writeFileSync(embeddingsFile, JSON.stringify(store));
  console.log(`Wrote ${texts.length} vectors to data/embeddings.json.`);
}

async function main(): Promise<void> {
  await writeProfiles();
  await writeEmbeddings();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
