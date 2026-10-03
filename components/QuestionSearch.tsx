"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { PracticeDialog } from "@/components/PracticeDialog";
import { QuestionCard } from "@/components/QuestionCard";
import { assessmentTypesForCourse, campuses, materialForId, questionsForCourse, topicForId, topicsForCourse } from "@/lib/seed";
import { searchQuestions } from "@/lib/question-search";
import { AssessmentType, Course, Question } from "@/lib/types";

export function QuestionSearch({ course }: { course: Course }) {
  const params = useSearchParams();
  const topics = topicsForCourse(course.id);
  const questions = questionsForCourse(course.id);
  const assessmentTypes = assessmentTypesForCourse(course.id);
  const courseCampuses = campuses.filter((campus) => questions.some((question) => materialForId(question.materialId)?.campus === campus));
  const [selectedTopics, setSelectedTopics] = useState<string[]>(() => params.getAll("topic").filter((id) => topicForId(id)?.courseId === course.id));
  const [selectedAssessments, setSelectedAssessments] = useState<AssessmentType[]>(() => params.getAll("assessment").filter((type): type is AssessmentType => assessmentTypes.includes(type as AssessmentType)));
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>(() => params.getAll("campus").filter((campus) => courseCampuses.includes(campus)));
  const [query, setQuery] = useState("");
  const [practiceCount, setPracticeCount] = useState(5);
  const [practiceSet, setPracticeSet] = useState<Question[] | null>(null);

  const results = useMemo(() => searchQuestions(questions, query, selectedTopics, selectedAssessments, selectedCampuses), [query, questions, selectedAssessments, selectedCampuses, selectedTopics]);

  // A fresh random sample of the current results each time, so repeated practice isn't always the top N.
  function startPractice(): void {
    const pool = [...results];
    for (let index = pool.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swap]] = [pool[swap], pool[index]];
    }
    setPracticeSet(pool.slice(0, practiceCount));
  }

  function toggleCampus(campus: string): void {
    setSelectedCampuses((current) => current.includes(campus) ? current.filter((item) => item !== campus) : [...current, campus]);
  }

  function toggleTopic(id: string): void {
    setSelectedTopics((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAssessment(type: AssessmentType): void {
    setSelectedAssessments((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <Link href={`/courses/${course.id}` as Route} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2b2f6b] hover:underline"><ArrowLeft size={14} />Back to {course.code} papers</Link>

      <section className="rounded-[3px] border border-[#ececec] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#999]" size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search curated questions" placeholder="Search a concept, name, or question…" className="w-full rounded-[3px] border border-[#cfcfcf] py-2 pl-10 pr-3 text-[14px] outline-none focus:border-[#2b2f6b]" />
        </div>
        <p className="mt-4 text-[13px] font-semibold">Topics</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {topics.map((topic) => <button key={topic.id} title={topic.description} onClick={() => toggleTopic(topic.id)} className={`rounded-[3px] border px-2.5 py-1 text-[13px] ${selectedTopics.includes(topic.id) ? "border-[#2b2f6b] bg-[#2b2f6b] text-white" : "border-[#cfcfcf] hover:border-[#2b2f6b]"}`}>{topic.name}</button>)}
        </div>
        {courseCampuses.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="mr-1 font-semibold">Campus</span>
            {courseCampuses.map((campus) => <button key={campus} onClick={() => toggleCampus(campus)} aria-pressed={selectedCampuses.includes(campus)} className={`rounded-full border px-3 py-1 ${selectedCampuses.includes(campus) ? "border-[#2b2f6b] bg-[#2b2f6b] text-white" : "border-[#cfcfcf] hover:border-[#2b2f6b]"}`}>{campus}</button>)}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          <span className="font-semibold">Exam type</span>
          {assessmentTypes.map((type) => <label key={type} className="flex cursor-pointer items-center gap-1.5"><input checked={selectedAssessments.includes(type)} onChange={() => toggleAssessment(type)} type="checkbox" className="h-4 w-4 accent-[#2b2f6b]" />{type}</label>)}
          {(selectedTopics.length > 0 || selectedAssessments.length > 0 || selectedCampuses.length > 0) && <button onClick={() => { setSelectedTopics([]); setSelectedAssessments([]); setSelectedCampuses([]); }} className="text-[#2b2f6b] underline">Clear filters</button>}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px]"><span className="font-semibold">{results.length}</span> curated {results.length === 1 ? "question" : "questions"}</p>
        <div className="flex items-center gap-2 text-[13px]">
          <select value={practiceCount} onChange={(event) => setPracticeCount(Number(event.target.value))} className="rounded-[3px] border border-[#cfcfcf] bg-white px-2 py-1.5"><option value={3}>3 questions</option><option value={5}>5 questions</option><option value={10}>10 questions</option></select>
          <button onClick={startPractice} disabled={results.length === 0} className="rounded-[3px] bg-[#2b2f6b] px-3 py-1.5 font-semibold text-white disabled:opacity-50">Practice</button>
        </div>
      </div>

      <p className="text-[12px] text-[#666]">Search covers the curated question bank, including topic keywords, answer options and linked diagram transcriptions. It does not yet include every question in the source papers.</p>

      <div className="space-y-3">
        {results.map((question) => <QuestionCard key={question.id} question={question} />)}
        {results.length === 0 && <div className="rounded-[3px] border border-dashed border-[#cfcfcf] p-10 text-center text-[14px] text-[#666]">No curated questions match these filters. Try another topic or clear the exam type.</div>}
      </div>

      {practiceSet && <PracticeDialog questions={practiceSet} onClose={() => setPracticeSet(null)} />}
    </div>
  );
}
