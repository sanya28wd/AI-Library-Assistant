import { NextRequest, NextResponse } from "next/server";
import { questionsByMeaning } from "@/lib/question-semantic";
import { searchQuestions } from "@/lib/question-search";
import { assessmentTypes, campuses, courseForId, questionsForCourse } from "@/lib/seed";
import { AssessmentType } from "@/lib/types";

// Questions that match a search by meaning rather than wording; the search page shows them under "Related by meaning".
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const course = courseForId(params.get("course") ?? "");
  if (!course?.available) return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  const assessments = params.getAll("assessment");
  const selectedCampuses = params.getAll("campus");
  if (assessments.some((value) => !assessmentTypes.includes(value as AssessmentType)) || selectedCampuses.some((value) => !campuses.includes(value))) {
    return NextResponse.json({ error: "Unknown filter value." }, { status: 400 });
  }
  const exclude = new Set(params.getAll("exclude"));
  // An empty query applies only the filters, so meaning search respects the same topic, exam-type and campus choices.
  const filtered = searchQuestions(questionsForCourse(course.id), "", params.getAll("topic"), assessments as AssessmentType[], selectedCampuses);
  const related = await questionsByMeaning(filtered.filter((question) => !exclude.has(question.id)), (params.get("q") ?? "").slice(0, 300));
  return NextResponse.json({ data: related });
}
