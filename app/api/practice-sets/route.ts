import { NextRequest, NextResponse } from "next/server";
import { assessmentOf, materialForId, questions } from "@/lib/seed";
import { AssessmentType } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as { courseId?: string; topicIds: string[]; assessmentTypes: AssessmentType[]; count: number };
  const candidates = questions.filter((question) => {
    const assessment = assessmentOf(question);
    const courseMatch = !body.courseId || materialForId(question.materialId)?.courseId === body.courseId;
    const topicMatch = body.topicIds.length === 0 || body.topicIds.some((id) => question.topicIds.includes(id));
    const assessmentMatch = body.assessmentTypes.length === 0 || (assessment !== null && body.assessmentTypes.includes(assessment));
    return courseMatch && topicMatch && assessmentMatch;
  });
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, Math.max(1, body.count));
  return NextResponse.json({ data: shuffled });
}
