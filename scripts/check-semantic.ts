// Measures keyword-only vs hybrid (keyword + meaning) retrieval on paraphrased questions that avoid the paper's own terms.
// Run after `npm run embed`: npm run check:semantic
import assert from "node:assert/strict";
import { hybridRetrieve, retrieve } from "../lib/retrieval";

type Case = { course: string; query: string; relevant: RegExp };

// `relevant` marks a passage that really covers the concept; each query deliberately avoids those words.
const cases: Case[] = [
  { course: "cs-f364", query: "how should I choose the dividing element so this sorting method is fastest or slowest", relevant: /pivot/i },
  { course: "cs-f364", query: "connect every vertex using the cheapest total set of links without cycles", relevant: /spanning tree|prim|kruskal/i },
  { course: "cs-f364", query: "give frequent characters shorter bit codes to compress a message", relevant: /huffman/i },
  { course: "cs-f364", query: "place pieces on a chessboard so that none of them can attack each other", relevant: /queen/i },
  { course: "cs-f364", query: "push as much water as possible through pipes from a source to a sink", relevant: /flow|residual/i },
  { course: "bits-f464", query: "my model does great on the data it learned from but badly on new data", relevant: /overfit|variance/i },
  { course: "bits-f464", query: "split customers into groups when we have no labels", relevant: /k-means|kmeans|cluster/i },
  { course: "bits-f464", query: "shrink the number of features while keeping most of the information", relevant: /principal component|pca|dimensionality|discriminant/i },
  { course: "bits-f464", query: "combine many weak learners so together they become a strong one", relevant: /boost|ensemble|random forest|bagging/i },
  { course: "bits-f464", query: "an agent learns by trial and error from rewards and penalties", relevant: /q-learning|q learning|reinforcement|reward/i },
  { course: "gs-f211", query: "the extra value workers create that the employer keeps instead of paying them", relevant: /surplus value/i },
  { course: "gs-f211", query: "a regime that controls newspapers and blames minorities to stay in power", relevant: /fascis|propaganda/i },
  { course: "gs-f211", query: "everyone gets a fixed monthly payment from the government whether or not they work", relevant: /ubi|basic income/i },
  { course: "gs-f211", query: "should the state stay out of the economy and let markets run themselves", relevant: /laissez|liberal|market|night watchman/i },
  { course: "gs-f211", query: "how men's dominance over women is built into society", relevant: /patriarch|feminis/i }
];

function rankOfFirstHit(excerpts: string[], relevant: RegExp): number | null {
  const index = excerpts.findIndex((excerpt) => relevant.test(excerpt));
  return index === -1 ? null : index + 1;
}

async function main(): Promise<void> {
  assert.ok(process.env.OPENAI_API_KEY, "Set OPENAI_API_KEY in .env.local; meaning search needs it for query embeddings.");
  let keywordHits = 0;
  let hybridHits = 0;
  let keywordReciprocal = 0;
  let hybridReciprocal = 0;
  for (const item of cases) {
    const keyword = rankOfFirstHit(retrieve(item.query, item.course, 6).map((source) => source.excerpt), item.relevant);
    const hybrid = rankOfFirstHit((await hybridRetrieve(item.query, item.course, 6)).map((source) => source.excerpt), item.relevant);
    keywordHits += keyword ? 1 : 0;
    hybridHits += hybrid ? 1 : 0;
    keywordReciprocal += keyword ? 1 / keyword : 0;
    hybridReciprocal += hybrid ? 1 / hybrid : 0;
    console.log(`${(keyword ? `#${keyword}` : "miss").padEnd(5)} → ${(hybrid ? `#${hybrid}` : "miss").padEnd(5)} ${item.course}  ${item.query}`);
  }
  const total = cases.length;
  console.log(`\nHit@6: keyword ${keywordHits}/${total}, hybrid ${hybridHits}/${total}`);
  console.log(`MRR@6: keyword ${(keywordReciprocal / total).toFixed(2)}, hybrid ${(hybridReciprocal / total).toFixed(2)}`);

  const unrelated = await hybridRetrieve("what is the best pizza place near the campus", "cs-f364", 6);
  console.log(`Unrelated question returned ${unrelated.length} passages.`);
  assert.ok(hybridHits >= keywordHits, "Hybrid retrieval must not find fewer relevant passages than keywords alone");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
