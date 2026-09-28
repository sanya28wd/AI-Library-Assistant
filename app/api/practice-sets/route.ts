import { NextRequest, NextResponse } from "next/server";
import { materialForId, questions } from "@/lib/seed";
import { AssessmentType } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as { topicIds: string[]; assessmentTypes: AssessmentType[]; count: number };
  const candidates = questions.filter((question) => {
    const material = materialForId(question.materialId);
    const topicMatch = body.topicIds.length === 0 || body.topicIds.some((id) => question.topicIds.includes(id));
    const assessmentMatch = body.assessmentTypes.length === 0 || (material?.assessmentType !== null && material !== undefined && body.assessmentTypes.includes(material.assessmentType));
    return topicMatch && assessmentMatch;
  });
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.max(1, body.count));
  return NextResponse.json({ data: shuffled });
}
