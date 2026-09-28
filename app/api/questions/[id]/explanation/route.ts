import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { questions, subject, topicForId } from "@/lib/seed";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  const question = questions.find((item) => item.id === id);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
  if (question.verifiedAnswer && question.answer) return NextResponse.json({ data: question.answer, source: "verified-answer-key" });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ data: "Add OPENAI_API_KEY to .env.local to generate a study explanation grounded in this question and the approved course-topic map.", source: "configuration" });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const topicNames = question.topicIds.map((topicId) => topicForId(topicId)?.name).filter(Boolean).join(", ");
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `You are a course study assistant. Explain this ${subject.code} question in a concise, academically careful way. Use only the question and the listed course topics. Clearly say when the material does not establish a fact.\n\nQuestion: ${question.text}\nTopics: ${topicNames}`
  });
  return NextResponse.json({ data: response.output_text, source: "ai-study-explanation" });
}
