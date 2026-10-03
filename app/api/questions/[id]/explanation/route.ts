import { NextRequest, NextResponse } from "next/server";
import { generateAnswer } from "@/lib/openai";
import { pageSource, retrieve } from "@/lib/retrieval";
import { courseForId, materialForId, questions, topicForId } from "@/lib/seed";
import { ChatSource, ExplanationResponse } from "@/lib/types";

function instructions(courseLabel: string, sources: ChatSource[]): string {
  const context = sources.map((source) => `[${source.id}] ${source.label}${source.page ? `, page ${source.page}` : ""}\n${source.excerpt}`).join("\n\n");
  return `You explain past exam questions for ${courseLabel} students at the BITS Pilani Dubai Campus library.

Source [1] is the paper page the question comes from; it holds the question's own data, tables and wording. Later sources are related course material, which may include answer keys or marking schemes.

Rules:
- Explain how to approach and solve the question: the idea being tested, the method step by step, and common mistakes. Work through the given data when the sources contain it.
- Cite sources inline as [1], [2] right after the claim they support. Use an answer key or marking scheme when one covers this question, and say so.
- If you explain anything the sources do not state, put it under the exact line "General explanation (not from your course material):" without citations.
- Do not invent numbers, edges, weights or table values that are not in the sources. If the data you need is missing from the extracted text, tell the student to open the source page [1].
- Formatting: plain text with short paragraphs and "- " bullet lists. You may use **bold** for a few key terms. Write maths in LaTeX, inline as \\( x^2 \\) and displayed as \\[ ... \\]. No headings, tables or code blocks.
- Keep it under about 250 words.

Sources:
${context || "(no matching passages were found)"}`;
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const question = questions.find((item) => item.id === id);
  const material = question && materialForId(question.materialId);
  const course = material && courseForId(material.courseId);
  if (!question || !material || !course) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (question.verifiedAnswer && question.answer) return NextResponse.json({ data: question.answer, sources: [], source: "verified-answer-key" } satisfies ExplanationResponse);

  // The question's own page first, then related passages from elsewhere in the course.
  const own = pageSource(material.id, question.page);
  const related = retrieve(`${question.text} ${question.topicIds.map((topicId) => topicForId(topicId)?.name ?? "").join(" ")}`, course.id, 6)
    .filter((source) => !(own && source.href === own.href))
    .slice(0, own ? 4 : 5);
  const sources = [own, ...related].filter((source): source is ChatSource => source !== null).map((source, index) => ({ ...source, id: index + 1 }));

  const prompt = `Question${question.marks ? ` (${question.marks} marks)` : ""}: ${question.text}${question.options ? `\nOptions: ${question.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("; ")}` : ""}`;
  let data: string | null;
  try {
    data = await generateAnswer(instructions(`${course.code} ${course.name}`, sources), prompt);
  } catch {
    return NextResponse.json({ error: "Unable to generate an explanation right now." }, { status: 502 });
  }
  if (data === null) return NextResponse.json({ data: "AI explanations are not switched on (no OPENAI_API_KEY). Open the source page to work through the question.", sources, source: "configuration" } satisfies ExplanationResponse);
  return NextResponse.json({ data: data || "No explanation was returned.", sources, source: "ai-study-explanation" } satisfies ExplanationResponse);
}
