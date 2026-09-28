import { NextRequest, NextResponse } from "next/server";
import { topics } from "@/lib/seed";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { text } = await request.json() as { text: string };
  const normalized = text.toLowerCase();
  const matches = topics.filter((topic) => topic.keywords.some((keyword) => normalized.includes(keyword)));
  return NextResponse.json({ data: matches, persisted: false });
}
