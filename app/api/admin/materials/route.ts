import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A source file is required." }, { status: 400 });
  return NextResponse.json({ data: { id: crypto.randomUUID(), fileName: file.name, status: "review", message: "Material queued for extraction and admin review." } }, { status: 202 });
}
