import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { CourseBanner } from "@/components/CourseBanner";
import { CourseSidebar } from "@/components/CourseSidebar";
import { LibraryShell, TwoColumn } from "@/components/LibraryShell";
import { NoticeDropzone } from "@/components/NoticeDropzone";
import { PaperCard } from "@/components/PaperCard";
import { courseForId, courses, papersForCourse, questionsForCourse, searchHref } from "@/lib/seed";

export function generateStaticParams(): { courseId: string }[] {
  return courses.filter((course) => course.available).map((course) => ({ courseId: course.id }));
}

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = courseForId(courseId);
  if (!course?.available) notFound();
  const engine = searchHref(course.id) as Route;
  const papers = papersForCourse(course.id);
  const questionCount = questionsForCourse(course.id).length;
  // Home-campus papers first, then any shared from other campuses.
  const campuses = [...new Set([course.campus, ...papers.map((paper) => paper.campus)])].filter((campus) => papers.some((paper) => paper.campus === campus));

  return (
    <LibraryShell chatCourse={course}>
      <TwoColumn sidebar={<CourseSidebar activeId={course.id} />}>
        <CourseBanner title={`${course.name} - ${course.code}`} />
        <div className="space-y-6 p-3 sm:p-4">
          <NoticeDropzone course={course} />

          <section>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
              <h2 className="text-[16px] font-semibold">Previous year papers</h2>
              <span className="text-[13px] text-[#666]">{papers.length} papers <span className="mx-1 text-[#ccc]">|</span> <Link href={engine} className="font-semibold text-[#2b2f6b] hover:underline">Search questions by topic →</Link></span>
            </div>
            {campuses.length === 1
              ? <div className="space-y-2">{papers.map((paper) => <PaperCard key={paper.id} paper={paper} course={course} />)}</div>
              : campuses.map((campus) => (
                <div key={campus} className="mt-4 first:mt-0">
                  <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[#666]">{campus} campus</h3>
                  <div className="space-y-2">{papers.filter((paper) => paper.campus === campus).map((paper) => <PaperCard key={paper.id} paper={paper} course={course} />)}</div>
                </div>
              ))}
          </section>

          <Link href={engine} className="group flex items-center justify-between gap-4 rounded-[3px] border border-[#ececec] border-l-4 border-l-[#1b8a9b] bg-white px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
            <span className="flex items-center gap-3">
              <Search className="shrink-0 text-[#1b8a9b]" size={22} />
              <span>
                <span className="block text-[14px] font-semibold">Search every {course.code} question by topic</span>
                <span className="block text-[13px] text-[#555]">{questionCount} reviewed questions with source pages, explanations and practice sets</span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#2b2f6b] group-hover:underline">Open question search <ArrowRight size={15} /></span>
          </Link>
        </div>
      </TwoColumn>
    </LibraryShell>
  );
}
