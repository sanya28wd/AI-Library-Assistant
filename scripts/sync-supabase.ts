import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { storedVectors, textKey } from "../lib/embeddings";
import { passageRecords } from "../lib/retrieval";
import { courses, materialForId, materials, questions, topics } from "../lib/seed";

type IngestedMaterial = {
  relativePath: string;
  extension: string;
  text: string;
  pages: string[] | null;
  ocrPages: number[];
};

type DatabaseRow = Record<string, unknown>;

const batchSize = 100;

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to synchronize Supabase.`);
  return value;
}

function serviceClient(): SupabaseClient {
  return createClient(
    requiredEnvironmentVariable("SUPABASE_URL"),
    requiredEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function catalogue(): IngestedMaterial[] {
  const path = join(process.cwd(), "data", "ingested-materials.json");
  return JSON.parse(readFileSync(path, "utf8")) as IngestedMaterial[];
}

function passageId(materialId: string, page: number | null, text: string): string {
  return createHash("sha256").update(`${materialId}\u0000${page ?? "document"}\u0000${text}`).digest("hex");
}

async function upsertRows(client: SupabaseClient, table: string, rows: DatabaseRow[], conflictColumns: string): Promise<void> {
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const { error } = await client.from(table).upsert(batch, { onConflict: conflictColumns });
    if (error) throw new Error(`Could not upsert ${table} rows ${start}-${start + batch.length - 1} (${error.code}): ${error.message}`);
  }
}

function pageRows(ingested: IngestedMaterial[]): DatabaseRow[] {
  return ingested.flatMap((item: IngestedMaterial) => {
    const material = materials.find((candidate) => candidate.source === item.relativePath);
    if (!material) return [];
    const pages = item.pages ?? [item.text];
    return pages.map((text: string, index: number) => ({
      material_id: material.id,
      page_number: index + 1,
      extracted_text: text,
      extraction_method: item.ocrPages.includes(index + 1) ? "tesseract-ocr" : item.extension.slice(1)
    }));
  });
}

function passageRows(): DatabaseRow[] {
  const vectors = storedVectors();
  return passageRecords().map((passage) => {
    const vector = vectors.get(textKey(passage.text));
    if (!vector) throw new Error(`Missing embedding for ${passage.materialId} page ${passage.page ?? "document"}. Run npm run embed first.`);
    return {
      id: passageId(passage.materialId, passage.page, passage.text),
      subject_id: passage.courseId,
      material_id: passage.materialId,
      page_number: passage.page,
      content: passage.text,
      visuals: passage.visuals,
      embedding: Array.from(vector)
    };
  });
}

async function replacePassages(client: SupabaseClient, rows: DatabaseRow[]): Promise<void> {
  const { error } = await client.from("retrieval_passages").delete().not("id", "is", null);
  if (error) throw new Error(`Could not clear generated retrieval passages (${error.code}): ${error.message}`);
  await upsertRows(client, "retrieval_passages", rows, "id");
}

async function main(): Promise<void> {
  const client = serviceClient();
  const ingested = catalogue();

  await upsertRows(client, "subjects", courses.map((course) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    campus: course.campus,
    semester: course.semester
  })), "id");

  await upsertRows(client, "topics", topics.map((topic) => ({
    id: topic.id,
    subject_id: topic.courseId,
    name: topic.name,
    description: topic.description,
    keywords: topic.keywords,
    review_status: "published"
  })), "id");

  await upsertRows(client, "course_materials", materials.map((material) => ({
    id: material.id,
    subject_id: material.courseId,
    campus: material.campus,
    title: material.title,
    file_name: material.fileName,
    source_path: material.source,
    kind: material.kind,
    year: material.year,
    session: material.session ?? null,
    assessment_type: material.assessmentType,
    page_count: material.pages,
    review_status: material.status
  })), "id");

  await upsertRows(client, "material_pages", pageRows(ingested), "material_id,page_number");

  await upsertRows(client, "questions", questions.map((question) => ({
    id: question.id,
    material_id: question.materialId,
    page_number: question.page,
    text: question.text,
    options: question.options ?? null,
    marks: question.marks,
    verified_answer: question.verifiedAnswer,
    answer: question.answer ?? null,
    review_status: materialForId(question.materialId)?.status ?? "review"
  })), "id");

  await upsertRows(client, "question_topics", questions.flatMap((question) => question.topicIds.map((topicId) => ({
    question_id: question.id,
    topic_id: topicId,
    confidence: 1,
    approved: true
  }))), "question_id,topic_id");

  const passages = passageRows();
  await replacePassages(client, passages);
  console.log(`Synchronized ${courses.length} courses, ${materials.length} materials, ${questions.length} questions and ${passages.length} retrieval passages.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
