import { NextRequest, NextResponse } from "next/server";
import { retrieve } from "@/lib/retrieval";
import { courseForId } from "@/lib/seed";
import { ChatMessage, ChatResponse, ChatSource } from "@/lib/types";

const maxHistory = 8;
const maxMessageLength = 1500;

function instructions(courseLabel: string, sources: ChatSource[]): string {
  const context = sources.map((source) => `[${source.id}] ${source.label}${source.page ? `, page ${source.page}` : ""}\n${source.excerpt}`).join("\n\n");
  return `You are the study assistant for ${courseLabel} in the BITS Pilani Dubai Campus library.

Rules:
- Ground your answer in the numbered course sources below and cite them inline as [1], [2] right after the claim they support.
- Past papers often contain only the question, not its explanation. If your answer explains anything the sources do not state, it MUST begin with the exact line "General explanation (not from your course material):" followed by that explanation without citations. Then add a line starting "In your past papers:" that lists which sources examine the topic and how, with citations, e.g. "Test 2 asked you to trace it with the near array [4]."
- Diagram transcriptions are question inputs, not worked solutions. Use the question number and caption to distinguish graphs on the same page. Do not infer missing edges, directions or weights from OCR fragments.
- If the sources are unrelated to the question, say so plainly and suggest which course topic or paper to look at.
- Formatting: plain text with short paragraphs and "- " bullet lists. You may use **bold** for a few key terms. Write maths in LaTeX, inline as \\( T(n) = \\Theta(n^2) \\) and displayed as \\[ ... \\]. No headings, tables or code blocks.
- When a source is an answer key, you may use it, but encourage the student to attempt the question first.
- Be concise and use plain language a second-year student can follow. Use short paragraphs or bullet points.
- Do not complete graded take-home work or an exam in progress for the student; explain the concept and point to sources instead.

Sources:
${context || "(no matching passages were found)"}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as { courseId?: string; messages?: ChatMessage[] };
  const course = courseForId(body.courseId ?? "");
  if (!course?.available) return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  const messages = (body.messages ?? [])
    .filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.trim())
    .slice(-maxHistory)
    .map((message) => ({ role: message.role, content: message.content.slice(0, maxMessageLength) }));
  const userTurns = messages.filter((message) => message.role === "user");
  if (userTurns.length === 0) return NextResponse.json({ error: "Ask a question first." }, { status: 400 });

  // Include the previous question so follow-ups like "explain that more simply" still retrieve the right passages.
  const sources = retrieve(userTurns.slice(-2).map((message) => message.content).join(" "), course.id);

  if (!process.env.OPENAI_API_KEY) {
    const answer = sources.length > 0
      ? "AI answers are not switched on yet (no OPENAI_API_KEY). These are the passages from your course material that best match your question:"
      : `I could not find anything in the ${course.code} papers or handout that matches that. Try naming a topic, algorithm, thinker or concept.`;
    return NextResponse.json({ answer, sources, mode: "sources-only" } satisfies ChatResponse);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "gpt-4.1-mini", instructions: instructions(`${course.code} ${course.name}`, sources), input: messages })
  });
  if (!response.ok) return NextResponse.json({ error: "The study assistant is unavailable right now." }, { status: 502 });
  const payload = await response.json() as { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };
  // output_text is an SDK convenience; the raw REST payload carries the text inside output[].content[].
  const answer = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("") ?? "";
  return NextResponse.json({ answer: answer || "No answer was returned.", sources, mode: "ai" } satisfies ChatResponse);
}
