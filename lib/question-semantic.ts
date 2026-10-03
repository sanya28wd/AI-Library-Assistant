import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { cosine, embedQuery, storedVectors, textKey } from "@/lib/embeddings";
import { topicForId } from "@/lib/seed";
import { Question } from "@/lib/types";

// Calibrated on paraphrased and unrelated searches: unrelated ones scored at most 0.22, intended questions 0.30 or more.
const minimumQuestionSimilarity = 0.28;

export const profilesFile = join(process.cwd(), "data", "question-profiles.json");

let cachedProfiles: { profiles: Record<string, string>; modified: number } | null = null;

/**
 * Plain-language profiles written by `npm run embed` (what each question tests and how a student might ask about it),
 * keyed by profileKey(). They let meaning search match wording the question itself never uses, such as "UBI".
 */
export function questionProfiles(): Record<string, string> {
  let modified = 0;
  try {
    modified = statSync(profilesFile).mtimeMs;
  } catch {
    return {};
  }
  if (cachedProfiles?.modified !== modified) cachedProfiles = { modified, profiles: JSON.parse(readFileSync(profilesFile, "utf8")) as Record<string, string> };
  return cachedProfiles.profiles;
}

export function profileKey(question: Question): string {
  return textKey([question.text, ...(question.options ?? [])].join("\n"));
}

/**
 * The short texts embedded for a curated question: its wording (with options, diagram captions and topics), the
 * profile's concept summary, and each profile phrasing on its own. A question scores as its best-matching view,
 * so a short student query is compared with short texts instead of one long diluted one.
 */
export function questionViews(question: Question): string[] {
  const core = [
    question.text,
    ...(question.options ?? []),
    ...(question.visuals ?? []).map((visual) => visual.caption),
    `Topics: ${question.topicIds.map((id) => topicForId(id)?.name ?? "").join(", ")}`
  ].join("\n");
  const profile = questionProfiles()[profileKey(question)] ?? "";
  const phrasings = profile.split("\n").filter((line) => line.trim().startsWith("- ")).map((line) => line.trim().slice(2).trim());
  const summary = profile.split("\n").filter((line) => line.trim() && !line.trim().startsWith("- ")).join(" ").trim();
  return [core, summary, ...phrasings].filter(Boolean);
}

/** Questions from `bank` that match the query by meaning, best first; empty when embeddings are unavailable. */
export async function questionsByMeaning(bank: Question[], query: string, limit = 5): Promise<Question[]> {
  if (!query.trim()) return [];
  const vector = await embedQuery(query);
  if (!vector) return [];
  const vectors = storedVectors();
  return bank.flatMap((question) => {
    const similarity = Math.max(-1, ...questionViews(question).map((view) => {
      const stored = vectors.get(textKey(view));
      return stored ? cosine(vector, stored) : -1;
    }));
    return similarity >= minimumQuestionSimilarity ? [{ question, similarity }] : [];
  }).sort((a, b) => b.similarity - a.similarity).slice(0, limit).map((item) => item.question);
}
