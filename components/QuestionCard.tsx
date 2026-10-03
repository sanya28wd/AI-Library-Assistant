"use client";

import { useState } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { RichAnswer } from "@/components/RichAnswer";
import { examLabel, materialForId, sourcePath, topicForId } from "@/lib/seed";
import { QuestionVisualContext } from "@/components/QuestionVisualContext";
import { StudyNudges } from "@/components/StudyNudges";
import { staticDemo } from "@/lib/site";
import { ExplanationResponse, Question } from "@/lib/types";

type Explanation = { status: "idle" | "loading" | "error" } | { status: "done"; response: ExplanationResponse };

export function QuestionCard({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [explanation, setExplanation] = useState<Explanation>({ status: "idle" });
  const material = materialForId(question.materialId);
  const verified = question.verifiedAnswer && Boolean(question.answer);
  const done = explanation.status === "done" ? explanation.response : null;

  // Fetched once on first reveal and kept for later toggles.
  async function reveal(): Promise<void> {
    const opening = !showAnswer;
    setShowAnswer(opening);
    if (!opening || verified || staticDemo || explanation.status === "loading" || explanation.status === "done") return;
    setExplanation({ status: "loading" });
    try {
      const response = await fetch(`/api/questions/${encodeURIComponent(question.id)}/explanation`, { method: "POST" });
      if (!response.ok) throw new Error();
      setExplanation({ status: "done", response: await response.json() as ExplanationResponse });
    } catch {
      setExplanation({ status: "error" });
    }
  }
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
        <button onClick={() => void reveal()} className="inline-flex items-center gap-1.5 font-semibold text-[#2b2f6b] hover:underline"><Sparkles size={14} />{showAnswer ? "Hide explanation" : "Reveal answer / explanation"}</button>
      </div>
      {showAnswer && (
        <div className="mt-3 border-l-4 border-[#1b8a9b] bg-[#f3f9fa] px-3 py-2 text-[14px] leading-6">
          {verified ? (
            <>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#1b6f7c]">Verified answer key</span>
              <p className="mt-1 text-[#333]">{question.answer}</p>
            </>
          ) : staticDemo ? (
            <p className="text-[#333]">AI explanations need the full version of this site. Open the source paper above to work through the question.</p>
          ) : !done && explanation.status !== "error" ? (
            <p className="flex items-center gap-2 text-[#555]"><Loader2 size={14} className="animate-spin" />Preparing an explanation from the course material…</p>
          ) : !done ? (
            <p className="text-[#b42318]">Could not load an explanation right now. Try again later, or open the source paper.</p>
          ) : (
            <>
              <span className="text-[12px] font-semibold uppercase tracking-wide text-[#1b6f7c]">{done.source === "ai-study-explanation" ? "AI explanation · not verified by faculty" : "Explanation unavailable"}</span>
              <div className="mt-1 whitespace-pre-wrap text-[#333]"><RichAnswer text={done.data} sources={done.sources} /></div>
              {done.sources.length > 0 && (
                <p className="mt-2 text-[12px] text-[#555]">Sources: {done.sources.map((source, index) => (
                  <span key={source.id}>{index > 0 && " · "}<a href={source.href} target="_blank" rel="noreferrer" className="text-[#2b2f6b] hover:underline">[{source.id}] {source.label}{source.page ? `, p${source.page}` : ""}</a></span>
                ))}</p>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}
