import { NextRequest, NextResponse } from "next/server";
import { assessmentTypes, campuses, courseForId, materialForId, questions } from "@/lib/seed";
import { searchQuestions } from "@/lib/question-search";
import { AssessmentType } from "@/lib/types";

export function GET(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams;
  const courseId = params.get("course");
  const topicIds = params.getAll("topic");
  const requestedAssessments = params.getAll("assessment");
  if (requestedAssessments.some((value) => !assessmentTypes.includes(value as AssessmentType))) {
    return NextResponse.json({ error: "Unknown assessment type." }, { status: 400 });
  }
  const selectedCampuses = params.getAll("campus");
  if (selectedCampuses.some((value) => !campuses.includes(value))) return NextResponse.json({ error: "Unknown campus." }, { status: 400 });
  if (courseId && !courseForId(courseId)?.available) return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  const selectedAssessments = requestedAssessments as AssessmentType[];
  const text = (params.get("q") ?? "").toLowerCase().trim();
  const bank = questions.filter((question) => !courseId || materialForId(question.materialId)?.courseId === courseId);
  const matches = searchQuestions(bank, text, topicIds, selectedAssessments, selectedCampuses);
  return NextResponse.json({ data: matches });
}
