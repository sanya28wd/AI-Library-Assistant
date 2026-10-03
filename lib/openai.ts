type ResponsesPayload = { output_text?: string; output?: { content?: { type: string; text?: string }[] }[] };

export type ModelInput = string | { role: "user" | "assistant"; content: string }[];

/** Calls the OpenAI Responses API. Returns null when no key is configured; throws when the call fails. */
export async function generateAnswer(instructions: string, input: ModelInput): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "gpt-4.1-mini", instructions, input })
  });
  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  const payload = await response.json() as ResponsesPayload;
  // output_text is an SDK convenience; the raw REST payload carries the text inside output[].content[].
  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("") ?? "";
}
