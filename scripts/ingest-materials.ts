import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, relative } from "node:path";
import mammoth from "mammoth";
import pdf from "pdf-parse/lib/pdf-parse.js";

type ExtractedMaterial = {
  fileName: string;
  relativePath: string;
  sourceDirectory: string;
  extension: string;
  sha256: string;
  characterCount: number;
  text: string;
  pages: string[] | null;
  ocrPages: number[];
  requiresOcr: boolean;
};

type TextItem = { str: string; transform: number[] };
type PageData = { getTextContent: (options: object) => Promise<{ items: TextItem[] }> };

const projectRoot = process.cwd();
const sourceFolders = ["papers", "course handout ", "exam notices "];
const ocrCacheFolder = join(projectRoot, "data", "ocr-cache");
// A page with less text than this is treated as a scan.
const minimumPageText = 40;

function sourceType(folder: string): string {
  if (folder === "papers") return "paper-or-answer-key";
  if (folder.includes("handout")) return "handout";
  return "notice-fixture";
}

function commandExists(command: string): boolean {
  return spawnSync("which", [command]).status === 0;
}

const canOcr = process.platform === "darwin" && commandExists("tesseract") && commandExists("swift");

// Mirrors pdf-parse's default page renderer, but keeps each page separate so passages can cite a page.
async function pdfPages(buffer: Buffer): Promise<string[]> {
  const pages: string[] = [];
  await pdf(buffer, {
    pagerender: async (pageData: PageData) => {
      const content = await pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
      let lastY: number | undefined;
      let text = "";
      for (const item of content.items) {
        text += lastY === undefined || lastY === item.transform[5] ? item.str : `\n${item.str}`;
        lastY = item.transform[5];
      }
      pages.push(text);
      return text;
    }
  });
  return pages;
}

async function ocrPages(filePath: string, sha256: string, pageNumbers: number[]): Promise<Record<number, string>> {
  const cachePath = join(ocrCacheFolder, `${sha256}.json`);
  const cached = existsSync(cachePath) ? JSON.parse(await readFile(cachePath, "utf8")) as Record<number, string> : {};
  const missing = pageNumbers.filter((page) => cached[page] === undefined);
  if (missing.length === 0 || !canOcr) return cached;

  const workFolder = await mkdtemp(join(tmpdir(), "ingest-ocr-"));
  try {
    const render = spawnSync("swift", [join(projectRoot, "scripts", "render-pdf-pages.swift"), filePath, workFolder, ...missing.map(String)], { encoding: "utf8" });
    if (render.status !== 0) throw new Error(`Could not render ${filePath}: ${render.stderr}`);
    for (const page of missing) {
      // --psm 1 detects page orientation, which matters for papers scanned sideways.
      const result = spawnSync("tesseract", [join(workFolder, `page-${page}.png`), "stdout", "--psm", "1", "-l", "eng"], { encoding: "utf8" });
      cached[page] = result.status === 0 ? result.stdout.replace(/\n\s*\n+/g, "\n").trim() : "";
    }
  } finally {
    await rm(workFolder, { recursive: true, force: true });
  }
  await mkdir(ocrCacheFolder, { recursive: true });
  await writeFile(cachePath, JSON.stringify(cached, null, 2));
  return cached;
}

async function extract(filePath: string, extension: string, buffer: Buffer, sha256: string): Promise<{ pages: string[] | null; text: string; ocrPages: number[] }> {
  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return { pages: null, text: result.value, ocrPages: [] };
  }
  const pages = await pdfPages(buffer);
  const scanned = pages.flatMap((text, index) => text.trim().length < minimumPageText ? [index + 1] : []);
  const recognised = scanned.length > 0 ? await ocrPages(filePath, sha256, scanned) : {};
  const ocrApplied = scanned.filter((page) => (recognised[page] ?? "").trim().length >= minimumPageText);
  ocrApplied.forEach((page) => { pages[page - 1] = recognised[page]; });
  return { pages, text: pages.join("\n\n"), ocrPages: ocrApplied };
}

async function listFiles(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => !entry.name.startsWith(".")).map((entry) => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? listFiles(path) : Promise.resolve(entry.isFile() ? [path] : []);
  }));
  return nested.flat();
}

async function ingestFolder(folder: string): Promise<ExtractedMaterial[]> {
  const fullPath = join(projectRoot, folder);
  if (!existsSync(fullPath)) return [];
  const files = (await listFiles(fullPath)).filter((path) => [".pdf", ".docx"].includes(extname(path).toLowerCase())).sort();
  const materials: ExtractedMaterial[] = [];
  // Sequential so OCR runs one file at a time.
  for (const filePath of files) {
    const extension = extname(filePath).toLowerCase();
    const buffer = await readFile(filePath);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const { pages, text, ocrPages } = await extract(filePath, extension, buffer, sha256);
    const relativePath = relative(projectRoot, filePath);
    if (ocrPages.length > 0) console.log(`OCR: ${relativePath} (pages ${ocrPages.join(", ")})`);
    materials.push({
      fileName: filePath.split("/").at(-1) ?? filePath,
      relativePath,
      sourceDirectory: sourceType(folder),
      extension,
      sha256,
      characterCount: text.trim().length,
      text,
      pages,
      ocrPages,
      requiresOcr: pages !== null && pages.some((page) => page.trim().length < minimumPageText)
    });
  }
  return materials;
}

async function main(): Promise<void> {
  if (!canOcr) console.warn("tesseract or swift not found: scanned PDF pages will be flagged for OCR review instead of read.");
  const result: ExtractedMaterial[] = [];
  for (const folder of sourceFolders) result.push(...await ingestFolder(folder));
  await writeFile(join(projectRoot, "data", "ingested-materials.json"), JSON.stringify(result, null, 2));
  const flagged = result.filter((material) => material.requiresOcr).length;
  console.log(`Prepared ${result.length} source files for admin review${flagged ? `; ${flagged} still have unreadable pages` : ""}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
