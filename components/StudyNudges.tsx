"use client";

import { useId, useState } from "react";
import { nudgesForQuestion } from "@/lib/study-nudges";
import { Question } from "@/lib/types";

export function StudyNudges({ question }: { question: Question }) {
  const panelId = useId();
  const attemptId = useId();
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState("");
  const [lastAttempt, setLastAttempt] = useState("");
  const [revealed, setRevealed] = useState(0);
  const nudges = nudgesForQuestion(question);
  const canContinue = revealed === 0 || (attempt.trim().length > 0 && attempt.trim() !== lastAttempt);

  function revealNudge(): void {
    if (!canContinue || revealed >= nudges.length) return;
    setLastAttempt(attempt.trim());
    setRevealed((current) => current + 1);
  }

  return (
    <div className="mt-3 text-[13px]">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((current) => !current)} className="font-semibold text-[#2b2f6b] hover:underline">{open ? "Hide nudges" : "Think it through · get a nudge"}</button>
      {open && (
        <section id={panelId} aria-label="Guided thinking" className="mt-2 space-y-3 rounded-[3px] border border-[#d6e8eb] bg-[#f3f9fa] p-3">
          <p>Try a step, then ask for a nudge. These are reflection prompts, not answer checks. Your writing stays on this page and is not saved.</p>
          <label className="block font-semibold" htmlFor={attemptId}>My attempt or where I’m stuck</label>
          <textarea id={attemptId} value={attempt} onChange={(event) => setAttempt(event.target.value)} rows={3} maxLength={3000} className="w-full rounded-[3px] border border-[#cfcfcf] bg-white p-2 font-normal outline-none focus:border-[#2b2f6b]" />
          <ol aria-live="polite" className="list-inside list-decimal space-y-2">{nudges.slice(0, revealed).map((nudge) => <li key={nudge}>{nudge}</li>)}</ol>
          {revealed < nudges.length
            ? <><button type="button" onClick={revealNudge} disabled={!canContinue} className="rounded-[3px] bg-[#2b2f6b] px-3 py-1.5 font-semibold text-white disabled:opacity-50">{revealed === 0 ? "First nudge" : "Next nudge"}</button>{revealed > 0 && <p>Update your attempt or describe what still confuses you before the next nudge.</p>}</>
            : <p>Now try completing your reasoning and checking it against the source paper.</p>}
        </section>
      )}
    </div>
  );
}
