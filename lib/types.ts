export type AssessmentType = "Quiz" | "Mid-semester" | "Comprehensive";
export type MaterialKind = "paper" | "answer-key" | "handout" | "notice";

export type Topic = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
};

export type Material = {
  id: string;
  title: string;
  fileName: string;
  kind: MaterialKind;
  year: string;
  assessmentType: AssessmentType | null;
  pages: number;
  status: "published" | "review" | "fixture";
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
