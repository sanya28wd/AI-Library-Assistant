import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// 512 dimensions keeps data/embeddings.json small; text-embedding-3-small loses little quality at this size.
export const embeddingModel = "text-embedding-3-small";
export const embeddingDimensions = 512;

export type EmbeddingStore = { model: string; dimensions: number; vectors: Record<string, string> };

export const embeddingsFile = join(process.cwd(), "data", "embeddings.json");

/** Stable key for a piece of text, so unchanged passages keep their stored vector across runs. */
export function textKey(text: string): string {
  return createHash("sha1").update(text).digest("hex");
}

function normalize(vector: number[]): Float32Array {
  const length = Math.hypot(...vector) || 1;
  return Float32Array.from(vector, (value) => value / length);
}

export function encodeVector(vector: Float32Array): string {
  return Buffer.from(vector.buffer, vector.byteOffset, vector.byteLength).toString("base64");
}

function decodeVector(encoded: string): Float32Array {
  const bytes = Buffer.from(encoded, "base64");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

/** Vectors are unit length, so the dot product is the cosine similarity. */
export function cosine(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let index = 0; index < a.length; index++) sum += a[index] * b[index];
  return sum;
}

/** Calls the OpenAI embeddings API in batches. Throws when no key is configured or the call fails. */
export async function embedTexts(texts: string[]): Promise<Float32Array[]> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  const vectors: Float32Array[] = [];
  for (let start = 0; start < texts.length; start += 100) {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: embeddingModel, dimensions: embeddingDimensions, input: texts.slice(start, start + 100) })
    });
    if (!response.ok) throw new Error(`Embedding request failed with ${response.status}: ${await response.text()}`);
    const payload = await response.json() as { data: { index: number; embedding: number[] }[] };
    payload.data.sort((a, b) => a.index - b.index).forEach((item) => vectors.push(normalize(item.embedding)));
  }
  return vectors;
}

let cachedStore: { vectors: Map<string, Float32Array>; modified: number } | null = null;

/** Stored vectors keyed by textKey(); empty when `npm run embed` has not been run. Reloaded when the file changes. */
export function storedVectors(): Map<string, Float32Array> {
  let modified = 0;
  try {
    modified = statSync(embeddingsFile).mtimeMs;
  } catch {
    return new Map();
  }
  if (cachedStore?.modified !== modified) {
    const store = JSON.parse(readFileSync(embeddingsFile, "utf8")) as EmbeddingStore;
    const usable = store.model === embeddingModel && store.dimensions === embeddingDimensions;
    cachedStore = { modified, vectors: new Map(usable ? Object.entries(store.vectors).map(([key, value]) => [key, decodeVector(value)]) : []) };
  }
  return cachedStore.vectors;
}

const queryCache = new Map<string, Float32Array>();

/** Embeds a search query, remembering recent ones; returns null when embeddings are unavailable. */
export async function embedQuery(query: string): Promise<Float32Array | null> {
  if (!process.env.OPENAI_API_KEY || storedVectors().size === 0) return null;
  const cached = queryCache.get(query);
  if (cached) return cached;
  try {
    const [vector] = await embedTexts([query]);
    if (queryCache.size > 500) queryCache.delete(queryCache.keys().next().value as string);
    queryCache.set(query, vector);
    return vector;
  } catch {
    return null;
  }
}
