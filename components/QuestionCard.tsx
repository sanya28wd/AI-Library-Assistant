"use client";

import { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { examLabel, materialForId, sourcePath, topicForId } from "@/lib/seed";
import { QuestionVisualContext } from "@/components/QuestionVisualContext";
import { StudyNudges } from "@/components/StudyNudges";
import { Question } from "@/lib/types";

export function QuestionCard({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const material = materialForId(question.materialId);
  return (
    <article className="rounded-[3px] border border-[#ececec] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <p className="text-[12px] text-[#666]"><span className="font-semibold text-[#1f2328]">{material && examLabel(material, question.page)}</span>{material && material.campus !== "Dubai" && <> · {material.campus} campus</>}{question.marks && <> · {question.marks} {question.marks === 1 ? "mark" : "marks"}</>}</p>
      <p className="mt-2 text-[15px] font-semibold leading-6">{question.text}</p>
      {question.options && <ol className="mt-2 list-inside list-[upper-alpha] space-y-0.5 text-[14px] text-[#444]">{question.options.map((option) => <li key={option}>{option}</li>)}</ol>}
      <p className="mt-3 text-[12px] text-[#666]">Topics: {question.topicIds.map((id) => topicForId(id)?.name).join(", ")}</p>
      <QuestionVisualContext question={question} />
      <StudyNudges question={question} />
      <div className="mt-3 flex flex-wrap gap-4 border-t border-[#f0f0f0] pt-3 text-[13px]">
        <a target="_blank" rel="noreferrer" href={`${sourcePath(material?.fileName ?? "")}#page=${question.page}`} className="inline-flex items-center gap-1.5 font-semibold text-[#2b2f6b] hover:underline"><FileText size={14} />Source paper · page {question.page}</a>
        <button onClick={() => setShowAnswer((current) => !current)} className="inline-flex items-center gap-1.5 font-semibold text-[#2b2f6b] hover:underline"><Sparkles size={14} />{showAnswer ? "Hide explanation" : "Reveal answer / explanation"}</button>
      </div>
      {showAnswer && (
        <div className="mt-3 border-l-4 border-[#1b8a9b] bg-[#f3f9fa] px-3 py-2 text-[14px] leading-6">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#1b6f7c]">{question.verifiedAnswer ? "Verified answer key" : "AI study explanation"}</span>
          <p className="mt-1 text-[#333]">{question.answer ?? "Use the linked source page to develop an answer. When an OpenAI API key is configured, this space will show a study explanation grounded in the course material."}</p>
        </div>
      )}
    </article>
  );
}
