import { NextRequest, NextResponse } from "next/server";
import { materialForId, questions, topicForId } from "@/lib/seed";
import { AssessmentType } from "@/lib/types";

export function GET(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams;
  const topicIds = params.getAll("topic");
  const assessmentTypes = params.getAll("assessment") as AssessmentType[];
  const text = (params.get("q") ?? "").toLowerCase().trim();
  const matches = questions.filter((question) => {
    const material = materialForId(question.materialId);
    const topicMatch = topicIds.length === 0 || topicIds.some((id) => question.topicIds.includes(id));
    const assessmentMatch = assessmentTypes.length === 0 || (material?.assessmentType !== null && material !== undefined && assessmentTypes.includes(material.assessmentType));
    const content = `${question.text} ${question.topicIds.map((id) => topicForId(id)?.name ?? "").join(" ")}`.toLowerCase();
    return topicMatch && assessmentMatch && (!text || content.includes(text));
  });
  return NextResponse.json({ data: matches });
}
