import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import mammoth from "mammoth";
import pdf from "pdf-parse";

type ExtractedMaterial = {
  fileName: string;
  sourceDirectory: string;
  extension: string;
  sha256: string;
  characterCount: number;
  text: string;
  requiresOcr: boolean;
};

const projectRoot = process.cwd();
const sourceFolders = ["papers", "course handout ", "exam notices "];

function sourceType(folder: string): string {
  if (folder === "papers") return "paper-or-answer-key";
  if (folder.includes("handout")) return "handout";
  return "notice-fixture";
}

async function extractText(filePath: string, extension: string): Promise<string> {
  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (extension === ".pdf") {
    const data = await pdf(await readFile(filePath));
    return data.text;
  }
  throw new Error(`Unsupported material format: ${extension}`);
}

async function ingestFolder(folder: string): Promise<ExtractedMaterial[]> {
  const fullPath = join(projectRoot, folder);
  const entries = await readdir(fullPath);
  const materials = await Promise.all(entries.map(async (fileName) => {
    const filePath = join(fullPath, fileName);
    const info = await stat(filePath);
    if (!info.isFile() || fileName.startsWith(".")) return null;
    const extension = extname(fileName).toLowerCase();
    if (extension !== ".pdf" && extension !== ".docx") return null;
    const buffer = await readFile(filePath);
    const text = await extractText(filePath, extension);
    return {
      fileName,
      sourceDirectory: sourceType(folder),
      extension,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      characterCount: text.trim().length,
      text,
      requiresOcr: extension === ".pdf" && text.trim().length < 120
    } satisfies ExtractedMaterial;
  }));
  return materials.filter((material): material is ExtractedMaterial => material !== null);
}

async function main(): Promise<void> {
  const groups = await Promise.all(sourceFolders.map(ingestFolder));
  const result = groups.flat();
  await writeFile(join(projectRoot, "data", "ingested-materials.json"), JSON.stringify(result, null, 2));
  console.log(`Prepared ${result.length} source files for admin review.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
