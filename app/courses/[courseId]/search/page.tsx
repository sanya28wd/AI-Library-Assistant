import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CourseBanner } from "@/components/CourseBanner";
import { CourseSidebar } from "@/components/CourseSidebar";
import { LibraryShell, TwoColumn } from "@/components/LibraryShell";
import { QuestionSearch } from "@/components/QuestionSearch";
import { courseForId, courses } from "@/lib/seed";

export function generateStaticParams(): { courseId: string }[] {
  return courses.filter((course) => course.available).map((course) => ({ courseId: course.id }));
}

export default async function SearchPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const course = courseForId(courseId);
  if (!course?.available) notFound();

  return (
    <LibraryShell chatCourse={course}>
      <TwoColumn sidebar={<CourseSidebar activeId={course.id} />}>
        <CourseBanner title={`${course.name} - ${course.code}`} compact />
        <Suspense>
          <QuestionSearch course={course} />
        </Suspense>
      </TwoColumn>
    </LibraryShell>
  );
}
