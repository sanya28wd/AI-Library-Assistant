import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/embeddings";
import { sourcePath } from "@/lib/seed";
import { ChatSource, MaterialKind, QuestionVisual } from "@/lib/types";

type MatchRow = {
  passage_id: string;
  material_id: string;
  page_number: number | null;
  content: string;
  visuals: QuestionVisual[];
  file_name: string;
  title: string;
  kind: MaterialKind;
  year: string;
  campus: string;
  assessment_type: string | null;
  similarity: number;
};

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when RETRIEVAL_BACKEND=supabase.`);
  return value;
}

function client(): SupabaseClient {
  return createClient(
    requiredEnvironmentVariable("SUPABASE_URL"),
    requiredEnvironmentVariable("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function label(row: MatchRow): string {
  if (row.kind === "handout") return `${row.title} (${row.year})`;
  const assessment = row.assessment_type ?? row.title;
  return `${assessment} - ${row.year} (${row.campus})`;
}

function validateRows(value: unknown): MatchRow[] {
  if (!Array.isArray(value)) throw new TypeError("Supabase match_course_passages returned a non-array response.");
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new TypeError("Supabase returned an invalid passage row.");
    const row = item as Partial<MatchRow>;
    if (typeof row.passage_id !== "string" || typeof row.material_id !== "string" || typeof row.content !== "string" || typeof row.file_name !== "string" || typeof row.title !== "string" || typeof row.kind !== "string" || typeof row.year !== "string" || typeof row.campus !== "string" || typeof row.similarity !== "number") {
      throw new TypeError(`Supabase returned an incomplete passage row: ${JSON.stringify(item)}`);
    }
    return { ...row, page_number: row.page_number ?? null, visuals: Array.isArray(row.visuals) ? row.visuals : [], assessment_type: row.assessment_type ?? null } as MatchRow;
  });
}

/** Retrieve course-filtered semantic matches from PostgreSQL/pgvector. */
export async function retrieveFromSupabase(query: string, courseId: string, limit: number): Promise<ChatSource[]> {
  if (!query.trim()) return [];
  const [embedding] = await embedTexts([query]);
  const { data, error } = await client().rpc("match_course_passages", {
    query_embedding: Array.from(embedding),
    query_text: query,
    match_subject_id: courseId,
    match_count: limit
  });
  if (error) throw new Error(`Supabase vector retrieval failed (${error.code}): ${error.message}`);
  return validateRows(data).map((row: MatchRow, index: number) => ({
    id: index + 1,
    label: label(row),
    page: row.page_number,
    href: `${sourcePath(row.file_name)}${row.page_number ? `#page=${row.page_number}` : ""}`,
    excerpt: row.content,
    ...(row.visuals.length > 0 && { visuals: row.visuals })
  }));
}
