import { topicsForCourse } from "@/lib/seed";
import { AssessmentType, Topic } from "@/lib/types";

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Keywords match at the start of a word, so "prims" does not fire inside "primary".
export function matchTopics(text: string, courseId: string): Topic[] {
  const normalized = text.toLowerCase();
  return topicsForCourse(courseId).filter((topic) => topic.keywords.some((keyword) => new RegExp(`(^|[^a-z0-9])${escape(keyword)}`).test(normalized)));
}

// A notice is about one exam, so the first heading-style mention wins: "COMPREHENSIVE EXAM NOTICE" may still refer back to the mid-sem.
export function detectAssessment(text: string): AssessmentType | null {
  const normalized = text.toLowerCase();
  const candidates: [AssessmentType, number][] = [
    ["Comprehensive", normalized.search(/compre/)],
    ["Mid-semester", normalized.search(/mid[\s-]*(sem|term)/)],
    ["Test", normalized.search(/\btest[\s-]*(1|2|i|ii)\b/)],
    ["Quiz", normalized.search(/quiz/)]
  ];
  const found = candidates.filter(([, index]) => index >= 0).sort((a, b) => a[1] - b[1]);
  return found[0]?.[0] ?? null;
}
