export type AssessmentType = "Quiz" | "Test" | "Mid-semester" | "Comprehensive";
export type MaterialKind = "paper" | "answer-key" | "handout" | "notice";

export type Course = {
  id: string;
  code: string;
  name: string;
  campus: string;
  semester: string;
  available: boolean;
};

export type Topic = {
  id: string;
  courseId: string;
  name: string;
  description: string;
  keywords: string[];
};

// One exam inside a paper file; many archived PDFs bundle a semester's quizzes, tests and compre.
export type PaperSection = {
  label: string;
  assessmentType: AssessmentType;
  startPage: number;
  note?: "answer key" | "solutions";
};

export type Material = {
  id: string;
  courseId: string;
  campus: string;
  title: string;
  /** Path under public/materials. */
  fileName: string;
  /** Path of the original under the project root, as recorded by `npm run ingest`. */
  source: string;
  kind: MaterialKind;
  year: string;
  session?: string;
  assessmentType: AssessmentType | null;
  pages: number;
  status: "published" | "review" | "fixture";
  answerKeyId?: string;
  sections?: PaperSection[];
};

export type Question = {
  id: string;
  text: string;
  options?: string[];
  marks: number | null;
  topicIds: string[];
  materialId: string;
  page: number;
  answer?: string;
  verifiedAnswer: boolean;
};

export type NoticePreview = {
  data: Topic[];
  assessmentType: AssessmentType | null;
  textFound: boolean;
  persisted: false;
};

export type ChatSource = { id: number; label: string; page: number | null; href: string; excerpt: string };
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatResponse = { answer: string; sources: ChatSource[]; mode: "ai" | "sources-only" };
