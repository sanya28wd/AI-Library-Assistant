"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronRight, FileText, GraduationCap, Search, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { materialForId, materials, questions, subject, topicForId, topics } from "@/lib/seed";
import { AssessmentType, Question } from "@/lib/types";

const assessmentTypes: AssessmentType[] = ["Quiz", "Mid-semester", "Comprehensive"];

function sourcePath(fileName: string): string {
  return `/materials/${encodeURIComponent(fileName)}`;
}

export default function Home() {
  const [role, setRole] = useState<"student" | "admin">("student");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedAssessments, setSelectedAssessments] = useState<AssessmentType[]>([]);
  const [query, setQuery] = useState("");
  const [noticeText, setNoticeText] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  const [practiceCount, setPracticeCount] = useState(5);
  const [practiceMode, setPracticeMode] = useState(false);

  const results = useMemo(() => {
    const search = query.toLowerCase().trim();
    return questions.filter((question) => {
      const material = materialForId(question.materialId);
      const matchesTopics = selectedTopics.length === 0 || selectedTopics.some((id) => question.topicIds.includes(id));
      const matchesAssessment = selectedAssessments.length === 0 || (material?.assessmentType !== null && material !== undefined && selectedAssessments.includes(material.assessmentType));
      const searchable = `${question.text} ${question.topicIds.map((id) => topicForId(id)?.name ?? "").join(" ")}`.toLowerCase();
      return matchesTopics && matchesAssessment && (!search || searchable.includes(search));
    });
  }, [query, selectedAssessments, selectedTopics]);

  function toggleTopic(id: string): void {
    setSelectedTopics((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAssessment(type: AssessmentType): void {
    setSelectedAssessments((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  function analyseNotice(): void {
    const terms = noticeText.toLowerCase();
    const matches = topics.filter((topic) => topic.keywords.some((keyword) => terms.includes(keyword))).map((topic) => topic.id);
    setSelectedTopics(matches);
    setShowNotice(false);
  }

  if (role === "admin") {
    return <AdminView onStudent={() => setRole("student")} />;
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#17253f]">
      <header className="border-b border-[#dce3ef] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#123b70] text-white"><GraduationCap size={24} /></div>
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1244d]">BITS Pilani, Dubai Campus</p><h1 className="text-lg font-bold">Study Library</h1></div>
          </div>
          <button onClick={() => setRole("admin")} className="rounded-lg border border-[#c9d4e4] px-3 py-2 text-sm font-semibold text-[#123b70] hover:bg-[#eef3fb]">Demo: Admin view</button>
        </div>
      </header>

      <section className="border-b border-[#174781] bg-[#123b70] text-white">
        <div className="mx-auto max-w-7xl px-5 py-9 md:py-12">
          <p className="mb-2 text-sm font-semibold text-[#f7c8d8]">{subject.code} · {subject.semester}</p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">Find the questions behind your syllabus.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#dce8f6]">Search reviewed questions across quizzes, mid-sems, and comprehensive exams. Use a course topic, paste topics from your notice, or upload it privately.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/10 px-3 py-1.5">{questions.length} reviewed questions</span><span className="rounded-full bg-white/10 px-3 py-1.5">All assessment types included</span><span className="rounded-full bg-white/10 px-3 py-1.5">Source pages linked</span></div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#dce3ef] bg-white p-5 shadow-sm"><p className="text-sm font-bold">Choose topics</p><p className="mt-1 text-xs leading-5 text-slate-500">Select one or more course topics.</p><div className="mt-4 space-y-2">{topics.map((topic) => <button key={topic.id} onClick={() => toggleTopic(topic.id)} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${selectedTopics.includes(topic.id) ? "border-[#a1244d] bg-[#fff4f7] text-[#8e1e45]" : "border-[#e2e8f0] hover:border-[#a9bad0]"}`}><span className="font-semibold">{topic.name}</span><span className="mt-1 block text-xs text-slate-500">{topic.description}</span></button>)}</div></section>
          <section className="rounded-2xl border border-[#dce3ef] bg-white p-5 shadow-sm"><p className="text-sm font-bold">Assessment source</p><p className="mt-1 text-xs leading-5 text-slate-500">Leave empty to search every paper type.</p><div className="mt-3 space-y-2">{assessmentTypes.map((type) => <label key={type} className="flex cursor-pointer items-center gap-2 text-sm"><input checked={selectedAssessments.includes(type)} onChange={() => toggleAssessment(type)} type="checkbox" className="h-4 w-4 accent-[#a1244d]" />{type}</label>)}</div></section>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-[#dce3ef] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h3 className="font-bold">Start from your exam notice</h3><p className="mt-1 text-sm text-slate-600">We identify relevant course topics. The notice stays in this browser session.</p></div><button onClick={() => setShowNotice(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a1244d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#861b3c]"><Upload size={16} />Use a notice</button></div>
            {selectedTopics.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{selectedTopics.map((id) => <span key={id} className="rounded-full bg-[#eaf1fb] px-3 py-1 text-xs font-semibold text-[#123b70]">{topicForId(id)?.name}</span>)}</div>}
          </section>

          <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a concept, thinker, or question..." className="w-full rounded-xl border border-[#cdd9e8] bg-white py-3 pl-11 pr-4 text-sm outline-none ring-[#123b70] focus:ring-2" /></div>

          <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Relevant questions</h3><p className="mt-1 text-sm text-slate-500">{results.length} reviewed results from all available assessment types.</p></div><div className="flex items-center gap-2"><select value={practiceCount} onChange={(event) => setPracticeCount(Number(event.target.value))} className="rounded-lg border border-[#cdd9e8] bg-white px-3 py-2 text-sm"><option value={3}>3 questions</option><option value={5}>5 questions</option><option value={10}>10 questions</option></select><button onClick={() => setPracticeMode(true)} disabled={results.length === 0} className="rounded-lg bg-[#123b70] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Practice</button></div></div><div className="space-y-3">{results.map((question) => <QuestionCard key={question.id} question={question} />)}{results.length === 0 && <div className="rounded-xl border border-dashed border-[#b9c8db] bg-white p-10 text-center text-sm text-slate-500">No reviewed questions match these filters. Try another topic or clear an assessment filter.</div>}</div></section>
        </div>
      </div>

      {showNotice && <NoticeDialog noticeText={noticeText} onChange={setNoticeText} onClose={() => setShowNotice(false)} onAnalyse={analyseNotice} />}
      {practiceMode && <PracticeDialog questions={results.slice(0, practiceCount)} onClose={() => setPracticeMode(false)} />}
    </main>
  );
}

function QuestionCard({ question }: { question: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const material = materialForId(question.materialId);
  return <article className="rounded-xl border border-[#dce3ef] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold"><span className="rounded-full bg-[#eaf1fb] px-2.5 py-1 text-[#123b70]">{material?.assessmentType}</span><span className="rounded-full bg-[#fff3e8] px-2.5 py-1 text-[#9a4a13]">{material?.year}</span>{question.marks && <span className="text-slate-500">{question.marks} marks</span>}</div><p className="mt-3 text-[15px] font-semibold leading-6">{question.text}</p>{question.options && <ol className="mt-3 list-inside list-[upper-alpha] space-y-1 text-sm text-slate-600">{question.options.map((option) => <li key={option}>{option}</li>)}</ol>}<div className="mt-4 flex flex-wrap items-center gap-2">{question.topicIds.map((id) => <span key={id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{topicForId(id)?.name}</span>)}</div><div className="mt-4 flex flex-wrap gap-3 text-sm"><a target="_blank" href={sourcePath(material?.fileName ?? "")} className="inline-flex items-center gap-1.5 font-semibold text-[#123b70] hover:underline"><FileText size={15} />Source · page {question.page}</a><button onClick={() => setShowAnswer((current) => !current)} className="inline-flex items-center gap-1.5 font-semibold text-[#a1244d] hover:underline"><Sparkles size={15} />{showAnswer ? "Hide explanation" : "Show explanation"}</button></div>{showAnswer && <div className="mt-4 rounded-lg border border-[#f2cedb] bg-[#fff7fa] p-3 text-sm leading-6"><span className="font-bold text-[#8e1e45]">{question.verifiedAnswer ? "Verified answer key" : "AI study explanation"}</span><p className="mt-1 text-slate-700">{question.answer ?? "Use the linked source and handout to develop an answer. When an OpenAI API key is configured, this space will show a handout-grounded explanation."}</p></div>}</article>;
}

function NoticeDialog({ noticeText, onChange, onClose, onAnalyse }: { noticeText: string; onChange: (value: string) => void; onClose: () => void; onAnalyse: () => void }) {
  return <div className="fixed inset-0 z-20 grid place-items-center bg-[#07182e]/55 p-5"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#a1244d]">Private notice check</p><h3 className="mt-1 text-xl font-bold">Paste the topics in your exam notice</h3></div><button onClick={onClose} className="text-slate-500">Close</button></div><p className="mt-3 text-sm leading-6 text-slate-600">You can also upload a notice in the production setup. For this local demo, paste its text and we will suggest matching GS F211 topics without saving it.</p><textarea value={noticeText} onChange={(event) => onChange(event.target.value)} placeholder="Example: Liberalism, Marxism, surplus value, fascism..." className="mt-4 h-36 w-full rounded-xl border border-[#cdd9e8] p-3 text-sm outline-none focus:ring-2 focus:ring-[#123b70]" /><div className="mt-5 flex justify-end gap-3"><button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button onClick={onAnalyse} className="rounded-lg bg-[#123b70] px-4 py-2 text-sm font-semibold text-white">Find matching topics</button></div></div></div>;
}

function PracticeDialog({ questions, onClose }: { questions: Question[]; onClose: () => void }) {
  return <div className="fixed inset-0 z-20 overflow-y-auto bg-[#07182e]/55 p-5"><div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#a1244d]">Practice set</p><h3 className="mt-1 text-2xl font-bold">{questions.length} selected questions</h3></div><button onClick={onClose} className="text-slate-500">Close</button></div><div className="mt-6 space-y-6">{questions.map((question, index) => <div key={question.id} className="border-b border-slate-200 pb-6"><p className="text-xs font-bold text-slate-400">QUESTION {index + 1}</p><p className="mt-2 font-semibold leading-6">{question.text}</p>{question.options && <div className="mt-3 grid gap-2">{question.options.map((option) => <button key={option} className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-[#123b70]">{option}</button>)}</div>} {!question.options && <textarea className="mt-3 h-24 w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="Write your response here (not saved)" />}</div>)}</div><button onClick={onClose} className="mt-2 rounded-lg bg-[#123b70] px-4 py-2 text-sm font-semibold text-white">Finish practice</button></div></div>;
}

function AdminView({ onStudent }: { onStudent: () => void }) {
  const published = materials.filter((material) => material.status === "published").length;
  const review = materials.filter((material) => material.status === "review").length;
  return <main className="min-h-screen bg-[#f6f8fc] text-[#17253f]"><header className="border-b border-[#dce3ef] bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#a1244d] text-white"><ShieldCheck size={22} /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1244d]">Development workspace</p><h1 className="text-lg font-bold">GS F211 Content Review</h1></div></div><button onClick={onStudent} className="rounded-lg border border-[#c9d4e4] px-3 py-2 text-sm font-semibold text-[#123b70]">Student view</button></div></header><div className="mx-auto max-w-7xl px-5 py-8"><div className="grid gap-4 md:grid-cols-3"><Metric label="Source files" value={String(materials.length)} description="Papers, keys, handout and fixtures" /><Metric label="Published materials" value={String(published)} description="Visible to student search" /><Metric label="Needs review" value={String(review)} description="Extract and verify before publishing" /></div><section className="mt-7 rounded-2xl border border-[#dce3ef] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Material processing queue</h2><p className="mt-1 text-sm text-slate-600">Every new upload is extracted, tagged against the handout, and reviewed before students see it.</p></div><button className="inline-flex items-center gap-2 rounded-lg bg-[#a1244d] px-4 py-2.5 text-sm font-semibold text-white"><Upload size={16} />Upload material</button></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3">Material</th><th className="pb-3">Type</th><th className="pb-3">Assessment</th><th className="pb-3">Status</th><th className="pb-3">Action</th></tr></thead><tbody>{materials.map((material) => <tr key={material.id} className="border-b border-slate-100"><td className="py-3"><p className="font-semibold">{material.title}</p><p className="text-xs text-slate-500">{material.fileName}</p></td><td className="py-3 capitalize">{material.kind}</td><td className="py-3">{material.assessmentType ?? "Course material"}</td><td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${material.status === "published" ? "bg-emerald-50 text-emerald-700" : material.status === "review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{material.status}</span></td><td className="py-3"><a href={sourcePath(material.fileName)} target="_blank" className="font-semibold text-[#123b70]">Preview <ChevronRight className="inline" size={14} /></a></td></tr>)}</tbody></table></div></section><section className="mt-7 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-[#dce3ef] bg-white p-6 shadow-sm"><h2 className="font-bold">Approved topic map</h2><p className="mt-1 text-sm text-slate-600">Topics are grounded in the GS F211 handout.</p><div className="mt-4 space-y-3">{topics.map((topic) => <div key={topic.id} className="rounded-lg bg-slate-50 p-3"><p className="font-semibold">{topic.name}</p><p className="mt-1 text-sm text-slate-600">{topic.description}</p></div>)}</div></div><div className="rounded-2xl border border-[#dce3ef] bg-white p-6 shadow-sm"><h2 className="font-bold">Publish checklist</h2><div className="mt-4 space-y-3 text-sm">{["Confirm course, year and assessment type.", "Review each extracted question and its source page.", "Approve or correct suggested topic tags.", "Link a verified answer key when available.", "Publish only questions students can rely on."].map((text) => <div key={text} className="flex gap-3"><CheckCircle2 className="shrink-0 text-[#a1244d]" size={18} /><span>{text}</span></div>)}</div></div></section></div></main>;
}

function Metric({ label, value, description }: { label: string; value: string; description: string }) { return <div className="rounded-xl border border-[#dce3ef] bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold text-[#123b70]">{value}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div>; }
