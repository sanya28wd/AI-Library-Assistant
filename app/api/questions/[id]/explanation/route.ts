import { NextRequest, NextResponse } from "next/server";
import { courseForId, materialForId, questions, topicForId } from "@/lib/seed";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const question = questions.find((item) => item.id === id);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (question.verifiedAnswer && question.answer) return NextResponse.json({ data: question.answer, source: "verified-answer-key" });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ data: "Add OPENAI_API_KEY to .env.local to generate a study explanation grounded in this question and the approved course-topic map.", source: "configuration" });
  const topicNames = question.topicIds.map((topicId) => topicForId(topicId)?.name).filter(Boolean).join(", ");
  const prompt = `You are a course study assistant. Explain this ${courseForId(materialForId(question.materialId)?.courseId ?? "")?.code ?? "course"} question in a concise, academically careful way. Use only the question and the listed course topics. Clearly say when the material does not establish a fact.\n\nQuestion: ${question.text}\nTopics: ${topicNames}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "gpt-4.1-mini", input: prompt })
  });
  if (!response.ok) return NextResponse.json({ error: "Unable to generate an explanation." }, { status: 502 });
  const payload = await response.json() as { output_text?: string };
  return NextResponse.json({ data: payload.output_text ?? "No explanation was returned.", source: "ai-study-explanation" });
}
