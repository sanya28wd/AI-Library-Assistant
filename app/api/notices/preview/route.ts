import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
// The package entry point reads a bundled test PDF when it is not required from Node directly, which breaks under Next.
import pdf from "pdf-parse/lib/pdf-parse.js";
import { detectAssessment, matchTopics } from "@/lib/notice";
import { courseForId } from "@/lib/seed";
import { NoticePreview } from "@/lib/types";

const maxBytes = 5 * 1024 * 1024;

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return (await pdf(buffer)).text;
  if (name.endsWith(".docx")) return (await mammoth.extractRawText({ buffer })).value;
  throw new Error("Upload a PDF or DOCX notice.");
}

// The notice is read in memory to suggest topics and is never written to disk or the database.
export async function POST(request: NextRequest): Promise<NextResponse> {
  let text: string;
  let courseId: string;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    courseId = String(form.get("courseId") ?? "");
    if (!(file instanceof File)) return NextResponse.json({ error: "A notice file is required." }, { status: 400 });
    if (file.size > maxBytes) return NextResponse.json({ error: "The notice must be smaller than 5 MB." }, { status: 413 });
    try {
      text = await extractText(file);
    } catch (error) {
      const message = error instanceof Error && error.message.startsWith("Upload") ? error.message : "We could not read that file.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    const body = await request.json() as { text?: string; courseId?: string };
    text = body.text ?? "";
    courseId = body.courseId ?? "";
  }
  if (!courseForId(courseId)?.available) return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  const body: NoticePreview = { data: matchTopics(text, courseId), assessmentType: detectAssessment(text), textFound: text.trim().length > 0, persisted: false };
  return NextResponse.json(body);
}
