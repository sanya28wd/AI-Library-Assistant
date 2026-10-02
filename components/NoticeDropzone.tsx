"use client";

import { useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ArrowRight, FileUp, Loader2, X } from "lucide-react";
import { detectAssessment, matchTopics } from "@/lib/notice";
import { searchHref, topicsForCourse } from "@/lib/seed";
import { staticDemo } from "@/lib/site";
import { Course, NoticePreview } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "reading"; label: string }
  | { status: "error"; message: string }
  | { status: "done"; label: string; preview: NoticePreview };

export function NoticeDropzone({ course }: { course: Course }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [limitToAssessment, setLimitToAssessment] = useState(true);
  const topics = topicsForCourse(course.id);

  async function preview(label: string, request: RequestInit): Promise<void> {
    setState({ status: "reading", label });
    try {
      const response = await fetch("/api/notices/preview", { method: "POST", ...request });
      const body = await response.json() as NoticePreview & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "We could not read that notice.");
      setSelected(body.data.map((topic) => topic.id));
      setLimitToAssessment(true);
      setState({ status: "done", label, preview: body });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "We could not read that notice." });
    }
  }

  function readFile(file: File | undefined): void {
    if (!file) return;
    if (staticDemo) {
      setState({ status: "error", message: "Reading PDF and DOCX notices needs the server version of this site. On this demo, paste the notice text instead." });
      setPasteOpen(true);
      return;
    }
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setState({ status: "error", message: "Upload the notice as a PDF or DOCX file." });
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("courseId", course.id);
    void preview(file.name, { body: form });
  }

  function readPaste(): void {
    if (!pasteText.trim()) return;
    if (staticDemo) {
      // Topic matching is plain keyword work, so the static demo can do it in the browser.
      const preview: NoticePreview = { data: matchTopics(pasteText, course.id), assessmentType: detectAssessment(pasteText), textFound: true, persisted: false };
      setSelected(preview.data.map((topic) => topic.id));
      setLimitToAssessment(true);
      setState({ status: "done", label: "Pasted notice text", preview });
      return;
    }
    void preview("Pasted notice text", { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: pasteText, courseId: course.id }) });
  }

  function reset(): void {
    setState({ status: "idle" });
    setSelected([]);
    if (input.current) input.current.value = "";
  }

  function toggle(id: string): void {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section className="rounded-[3px] border border-[#ececec] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:p-5">
      <h2 className="text-[16px] font-semibold">Preparing for an exam? Start from your notice</h2>
      <p className="mt-1 text-[13px] text-[#555]">Upload the quiz, test, mid-sem or compre notice and we will find matching past questions. Your notice is read once and never stored.</p>

      {state.status !== "done" && (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); readFile(event.dataTransfer.files[0]); }}
          onClick={() => input.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[3px] border-2 border-dashed px-4 py-8 text-center transition ${dragging ? "border-[#2b2f6b] bg-[#f3f4fb]" : "border-[#cfcfcf] bg-[#fafafa] hover:border-[#9a9a9a]"}`}
        >
          {state.status === "reading"
            ? <><Loader2 className="animate-spin text-[#2b2f6b]" size={26} /><p className="text-[14px]">Reading {state.label}…</p></>
            : <><FileUp className="text-[#2b2f6b]" size={26} /><p className="text-[14px]"><span className="font-semibold">Drop your exam notice here</span> or <span className="text-[#2b2f6b] underline">browse</span></p><p className="text-[12px] text-[#777]">PDF or DOCX, up to 5 MB</p></>}
          <input ref={input} type="file" accept=".pdf,.docx" className="hidden" onChange={(event) => readFile(event.target.files?.[0])} />
        </div>
      )}

      {state.status === "error" && <p className="mt-3 text-[13px] text-[#b42318]">{state.message}</p>}

      {state.status !== "done" && (
        <div className="mt-3 text-[13px]">
          <button onClick={() => setPasteOpen((open) => !open)} className="text-[#2b2f6b] underline">{pasteOpen ? "Hide text box" : "Or paste the notice text"}</button>
          {pasteOpen && (
            <div className="mt-2">
              <textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder={`Example: ${course.code} mid-sem covers ${topics.slice(0, 3).map((topic) => topic.name).join(", ")}…`} className="h-24 w-full rounded-[3px] border border-[#cfcfcf] p-2 text-[13px] outline-none focus:border-[#2b2f6b]" />
              <button onClick={readPaste} disabled={!pasteText.trim() || state.status === "reading"} className="mt-2 rounded-[3px] bg-[#2b2f6b] px-3 py-1.5 font-semibold text-white disabled:opacity-50">Read text</button>
            </div>
          )}
        </div>
      )}

      {state.status === "done" && (
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3 rounded-[3px] bg-[#f5f5f7] px-3 py-2.5 text-[13px]">
            <p>
              <span className="font-semibold">{state.label}</span>
              {state.preview.assessmentType && <> · {state.preview.assessmentType} exam notice</>}
            </p>
            <button onClick={reset} aria-label="Remove notice" className="text-[#777] hover:text-[#1f2328]"><X size={16} /></button>
          </div>

          <p className="mt-4 text-[13px] text-[#555]">
            {!state.preview.textFound
              ? "We could not find any text in this file (it may be a scan). Choose the topics on your notice below."
              : state.preview.data.length > 0
                ? `We found ${state.preview.data.length} course ${state.preview.data.length === 1 ? "topic" : "topics"} in your notice. Adjust them if needed.`
                : "Your notice does not name specific course topics. Choose the topics you are studying, or search all questions."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button key={topic.id} onClick={() => toggle(topic.id)} className={`rounded-[3px] border px-2.5 py-1 text-[13px] ${selected.includes(topic.id) ? "border-[#2b2f6b] bg-[#2b2f6b] text-white" : "border-[#cfcfcf] hover:border-[#2b2f6b]"}`}>{topic.name}</button>
            ))}
          </div>
          {state.preview.assessmentType && (
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={limitToAssessment} onChange={(event) => setLimitToAssessment(event.target.checked)} className="h-4 w-4 accent-[#2b2f6b]" />
              Only show {state.preview.assessmentType === "Comprehensive" ? "compre" : state.preview.assessmentType.toLowerCase()} questions
            </label>
          )}
          <button onClick={() => router.push(searchHref(course.id, selected, limitToAssessment ? state.preview.assessmentType : null) as Route)} className="mt-4 inline-flex items-center gap-2 rounded-[3px] bg-[#2b2f6b] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#1f2350]">
            Find matching questions <ArrowRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
