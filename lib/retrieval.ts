import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { courseForId, examLabel, materials, questions, sourcePath } from "@/lib/seed";
import { ChatSource, Material, QuestionVisual } from "@/lib/types";

type IngestedMaterial = { fileName: string; relativePath?: string; extension: string; text: string; pages?: string[] | null };

type Passage = { material: Material; page: number | null; text: string; terms: Map<string, number>; sequence: string; length: number; visuals: QuestionVisual[] };

const stopwords = new Set("the and for are but not you all any can had her was one our out has his how its may who did get him she too use what when where which while with this that from they them then than there their these those would could should about into your more most some such only other also been being have were will each does just very what's explain".split(" "));

// Notices are student-specific and never part of the answerable corpus.
const answerableKinds = new Set(["paper", "answer-key", "handout"]);

// Two-letter course terms worth keeping; other short tokens are mostly noise.
const shortTerms = new Set(["dp", "np", "em", "ai", "ml", "pc", "qp", "rl", "nn", "lp"]);

// Conservative plural folding: "queries" → "query", "graphs" → "graph", but "class", "bus", "analysis" and "uses" stay intact.
function singular(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(sses|ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[’']/g, "").split(/[^a-z0-9]+/).filter((word) => (word.length > 2 || shortTerms.has(word)) && !stopwords.has(word)).map(singular);
}

function chunk(text: string, size = 900): string[] {
  const paragraphs = text.split(/\n\s*\n|(?<=\.)\s*\n/).map((part) => part.replace(/\s+/g, " ").trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > size) {
      chunks.push(current);
      current = "";
    }
    current = current ? `${current} ${paragraph}` : paragraph;
  }
  if (current) chunks.push(current);
  return chunks;
}

function indexPassage(material: Material, page: number | null, text: string, visuals: QuestionVisual[]): Passage {
  const tokens = tokenize(text);
  const terms = new Map<string, number>();
  tokens.forEach((token) => terms.set(token, (terms.get(token) ?? 0) + 1));
  return { material, page, text, terms, sequence: ` ${tokens.join(" ")} `, length: tokens.length, visuals };
}

const catalogue = join(process.cwd(), "data", "ingested-materials.json");

function buildIndex(): Passage[] {
  let ingested: IngestedMaterial[];
  try {
    ingested = JSON.parse(readFileSync(catalogue, "utf8")) as IngestedMaterial[];
  } catch {
    return [];
  }
  const passages: Passage[] = [];
  for (const item of ingested) {
    // Older catalogues have no relativePath; their files all sat directly in a source folder.
    const material = materials.find((candidate) => item.relativePath ? candidate.source === item.relativePath : candidate.source.endsWith(`/${item.fileName}`));
    if (!material || !answerableKinds.has(material.kind) || !item.text.trim()) continue;
    // Older catalogues joined PDF pages with a blank line; DOCX text has no pages.
    const pages = item.pages ?? (item.extension === ".pdf" ? item.text.split(/\n\n/).slice(1) : [item.text]);
    pages.forEach((pageText, index) => {
      for (const text of chunk(pageText)) {
        passages.push(indexPassage(material, item.extension === ".pdf" ? index + 1 : null, text, []));
      }
    });
    // Keep each diagram question whole, even when several diagrams share a source page.
    for (const question of questions.filter((entry) => entry.materialId === material.id && entry.visuals?.length)) {
      const visuals = question.visuals;
      if (!visuals?.length) continue;
      const text = `${question.text}\n\n${visuals.map((visual) => `${visual.caption}\n${visual.description}`).join("\n\n")}`;
      passages.push(indexPassage(material, question.page, text, visuals));
    }
  }
  return passages;
}

let cached: { index: Passage[]; modified: number } | null = null;

// Rebuilt whenever `npm run ingest` rewrites the catalogue, without restarting the server.
function currentIndex(): Passage[] {
  let modified = 0;
  try {
    modified = statSync(catalogue).mtimeMs;
  } catch {
    return [];
  }
  if (cached?.modified !== modified) cached = { index: buildIndex(), modified };
  return cached.index;
}

function label(material: Material, page: number | null): string {
  const course = courseForId(material.courseId);
  if (material.kind === "handout") return `${course?.code ?? ""} Course Handout`.trim();
  if (material.kind === "answer-key") return `${material.title} (${material.year})`;
  const campus = course && material.campus !== course.campus ? ` (${material.campus})` : "";
  return `${examLabel(material, page ?? undefined)}${campus}`;
}

// Students type abbreviations that papers spell out ("DP" vs "dynamic programming"); expand them in the query only.
const abbreviations: Record<string, string> = {
  dp: "dynamic programming",
  mst: "minimum spanning tree",
  svm: "support vector machine",
  nn: "neural network",
  rl: "reinforcement learning",
  lp: "linear programming",
  em: "expectation maximization",
  bfs: "breadth first search",
  dfs: "depth first search"
};

function expandAbbreviations(query: string): string {
  return query.replace(/[A-Za-z]+/g, (word) => {
    const expansion = abbreviations[word.toLowerCase()];
    return expansion ? `${word} ${expansion}` : word;
  });
}

// BM25 over one course's ingested material; small enough to score in memory on every request.
export function retrieve(query: string, courseId: string, limit = 6): ChatSource[] {
  const index = currentIndex().filter((passage) => passage.material.courseId === courseId);
  const queryTokens = tokenize(expandAbbreviations(query));
  const queryTerms = [...new Set(queryTokens)];
  const phrases = queryTokens.slice(1).map((token, position) => ` ${queryTokens[position]} ${token} `);
  if (index.length === 0 || queryTerms.length === 0) return [];
  const averageLength = index.reduce((sum, passage) => sum + passage.length, 0) / index.length;
  const documentFrequency = new Map(queryTerms.map((term) => [term, index.filter((passage) => passage.terms.has(term)).length]));
  const scored = index.map((passage) => {
    let score = 0;
    for (const term of queryTerms) {
      const frequency = passage.terms.get(term) ?? 0;
      if (!frequency) continue;
      const df = documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (index.length - df + 0.5) / (df + 0.5));
      score += idf * (frequency * 2.2) / (frequency + 1.2 * (0.25 + 0.75 * passage.length / averageLength));
    }
    // Titles and names ("theory justice", "surplus value") should beat passages that only share the separate words.
    if (score > 0) score += phrases.filter((phrase) => passage.sequence.includes(phrase)).length * 2;
    return { passage, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

  return scored.map(({ passage }, position) => ({
    id: position + 1,
    label: label(passage.material, passage.page),
    page: passage.page,
    href: `${sourcePath(passage.material.fileName)}${passage.page ? `#page=${passage.page}` : ""}`,
    excerpt: passage.text,
    ...(passage.visuals.length > 0 && { visuals: passage.visuals })
  }));
}

/** The full extracted text of one paper page, so an explanation always sees the question's own data and tables. */
export function pageSource(materialId: string, page: number, id = 1): ChatSource | null {
  const passages = currentIndex().filter((passage) => passage.material.id === materialId && passage.page === page);
  if (passages.length === 0) return null;
  const material = passages[0].material;
  return {
    id,
    label: label(material, page),
    page,
    href: `${sourcePath(material.fileName)}#page=${page}`,
    excerpt: [...new Set(passages.map((passage) => passage.text))].join("\n").slice(0, 3000)
  };
}
