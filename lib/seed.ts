import catalog from "@/data/catalog.json";
import { basePath } from "@/lib/site";
import { AssessmentType, Course, Material, PaperSection, Question, Topic } from "@/lib/types";

// The course data lives in data/catalog.json so the Python backend reads the same file.
// Years, sessions and sections follow each paper's own exam headers (see data/ingested-materials.json).
// "papers/machine learning /hyderabad/Mid-Sem_ynm8NVG.pdf" is a byte-identical copy of Mid-Sem.pdf, so only one is listed.
export const courses = catalog.courses as Course[];
export const topics = catalog.topics as Topic[];
export const materials = catalog.materials as Material[];
export const questions = catalog.questions as Question[];

export function topicForId(id: string): Topic | undefined { return topics.find((topic) => topic.id === id); }
export function materialForId(id: string): Material | undefined { return materials.find((material) => material.id === id); }
export function courseForId(id: string): Course | undefined { return courses.find((course) => course.id === id); }

export const campuses: string[] = catalog.campuses;

export const assessmentTypes = catalog.assessmentTypes as AssessmentType[];

export function topicsForCourse(courseId: string): Topic[] { return topics.filter((topic) => topic.courseId === courseId); }
export function questionsForCourse(courseId: string): Question[] { return questions.filter((question) => materialForId(question.materialId)?.courseId === courseId); }

export function sourcePath(fileName: string): string {
  return `${basePath}/materials/${fileName.split("/").map(encodeURIComponent).join("/")}`;
}

/** The exam a page belongs to, for files that bundle several exams. */
export function sectionAt(material: Material, page: number): PaperSection | undefined {
  return material.sections?.filter((item) => item.startPage <= page).at(-1);
}

export function assessmentOf(question: Question): AssessmentType | null {
  const material = materialForId(question.materialId);
  if (!material) return null;
  return sectionAt(material, question.page)?.assessmentType ?? material.assessmentType;
}

/** "Test 2 - 2016-17 Second Semester", naming the exam on that page when the file bundles several. */
export function examLabel(material: Material, page?: number): string {
  const exam = (page ? sectionAt(material, page) : undefined) ?? (material.sections?.length === 1 ? material.sections[0] : undefined);
  return `${exam?.label ?? material.assessmentType ?? "Paper"} - ${material.year}${material.session ? ` ${material.session}` : ""}`;
}

export function paperTitle(material: Material): string {
  if ((material.sections?.length ?? 0) > 1) return `${material.year} ${material.session ?? ""}${material.offering ? ` (${material.offering})` : ""} - ${material.sections!.length} exams`.replace("  ", " ");
  return examLabel(material);
}

// Newest academic year first; "2024-25" and "2024" sort on their first year.
export function papersForCourse(courseId: string): Material[] {
  return materials
    .filter((material) => material.kind === "paper" && material.courseId === courseId)
    .sort((a, b) => b.year.localeCompare(a.year) || (b.session ?? "").localeCompare(a.session ?? ""));
}

export function assessmentTypesForCourse(courseId: string): AssessmentType[] {
  const used = new Set(questionsForCourse(courseId).map(assessmentOf));
  return assessmentTypes.filter((type) => used.has(type));
}

export const chatSuggestions: Record<string, string[]> = {
  "gs-f211": ["What is surplus value?", "How does fascism use propaganda?", "Summarise the main ideas of liberalism", "What has the compre asked about feminism?"],
  "bits-f464": ["What is the bias-variance trade-off?", "How do I calculate information gain?", "Explain PCA step by step", "What has the compre asked about SVMs?"],
  "cs-f364": ["How does Prim’s algorithm work?", "When is quicksort worst case?", "Explain the Hungarian method", "What NP-completeness questions come up in the compre?"]
};

export function searchHref(courseId: string, topicIds: string[] = [], assessment?: AssessmentType | null): string {
  const params = new URLSearchParams();
  topicIds.forEach((id) => params.append("topic", id));
  if (assessment) params.set("assessment", assessment);
  const query = params.toString();
  return `/courses/${courseId}/search${query ? `?${query}` : ""}`;
}
