import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  return NextResponse.json({ data: { id, status: "review", message: "Extraction is configured through scripts/ingest-materials.ts; review candidates before publication." } });
}
