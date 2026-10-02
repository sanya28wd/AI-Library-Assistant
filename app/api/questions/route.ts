import { NextRequest, NextResponse } from "next/server";
import { assessmentOf, materialForId, questions, topicForId } from "@/lib/seed";
import { AssessmentType } from "@/lib/types";

export function GET(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams;
  const courseId = params.get("course");
  const topicIds = params.getAll("topic");
  const assessmentTypes = params.getAll("assessment") as AssessmentType[];
  const text = (params.get("q") ?? "").toLowerCase().trim();
  const matches = questions.filter((question) => {
    const assessment = assessmentOf(question);
    const courseMatch = !courseId || materialForId(question.materialId)?.courseId === courseId;
    const topicMatch = topicIds.length === 0 || topicIds.some((id) => question.topicIds.includes(id));
    const assessmentMatch = assessmentTypes.length === 0 || (assessment !== null && assessmentTypes.includes(assessment));
    const content = `${question.text} ${question.topicIds.map((id) => topicForId(id)?.name ?? "").join(" ")}`.toLowerCase();
    return courseMatch && topicMatch && assessmentMatch && (!text || content.includes(text));
  });
  return NextResponse.json({ data: matches });
}
