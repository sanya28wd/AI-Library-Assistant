import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, FileUp, ListChecks, MessageCircle } from "lucide-react";
import { LibraryShell } from "@/components/LibraryShell";
import { courses } from "@/lib/seed";
import { basePath } from "@/lib/site";

const steps = [
  { icon: FileUp, title: "Upload your exam notice", text: "Drop in the quiz, test, mid-sem or compre notice. We pick out the topics it covers. The notice is never stored." },
  { icon: ListChecks, title: "Practise matching past questions", text: "Get questions from previous papers across BITS campuses, filtered to your syllabus, with the original paper one click away." },
  { icon: MessageCircle, title: "Ask the study assistant", text: "Stuck on a question? The assistant explains it and cites the past papers and answer keys it used." }
];

// A Dubai campus library photo at public/library-hero.jpg replaces the fallback strip.
function heroPhoto(): string {
  const file = existsSync(join(process.cwd(), "public", "library-hero.jpg")) ? "library-hero.jpg" : "library-banner.jpg";
  return `${basePath}/${file}`;
}

export default function Home() {
  // The hero buttons open the first course; students switch courses from its sidebar.
  const course = `/courses/${courses.find((item) => item.available)?.id ?? "gs-f211"}`;
  return (
    <LibraryShell variant="overlay">
      <section className="relative grid min-h-[min(88vh,760px)] place-items-center bg-[#1c2333] bg-cover bg-center px-4 pb-16 pt-32 text-center text-white sm:px-8" style={{ backgroundImage: `linear-gradient(rgba(10,14,24,0.62), rgba(10,14,24,0.72)), url(${heroPhoto()})` }}>
        <div className="max-w-4xl">
          <h1 className="text-[40px] font-bold leading-tight tracking-tight sm:text-[64px]">BITS Pilani Dubai Campus Library</h1>
          <p className="mt-3 text-[20px] font-semibold sm:text-[26px]">Past Papers · Practice · Study Help</p>
          <p className="mx-auto mt-5 max-w-3xl text-[15px] leading-7 text-white/90 sm:text-[17px]">
            Find previous year question papers from every BITS campus, upload your exam notice to get practice questions matched to your syllabus, and get explanations that point back to the papers and answer keys they come from.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`${course}#papers` as Route} className="rounded-[3px] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1f2328] shadow-sm transition hover:bg-[#ececec]">Browse past papers</Link>
            <Link href={course as Route} className="rounded-[3px] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1f2328] shadow-sm transition hover:bg-[#ececec]">Start from my exam notice</Link>
            <a href="#how-it-works" className="rounded-[3px] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1f2328] shadow-sm transition hover:bg-[#ececec]">How it works</a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-4 px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-[24px] font-semibold">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-[4px] border border-[#ececec] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f2f8] text-[#2b2f6b]"><Icon size={19} /></span>
                  <span className="text-[13px] font-semibold uppercase tracking-wide text-[#1b6f7c]">Step {index + 1}</span>
                </span>
                <p className="mt-3 text-[16px] font-semibold">{title}</p>
                <p className="mt-1 text-[14px] leading-6 text-[#555]">{text}</p>
              </li>
            ))}
          </ol>
          <Link href={course as Route} className="mt-8 inline-flex items-center gap-1.5 rounded-[3px] bg-[#2b2f6b] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1f2350]">Get started <ArrowRight size={15} /></Link>
        </div>
      </section>
    </LibraryShell>
  );
}
