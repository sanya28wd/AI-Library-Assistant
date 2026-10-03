"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { PaperCard } from "@/components/PaperCard";
import { campuses } from "@/lib/seed";
import { Course, Material } from "@/lib/types";

export function CampusPapers({ course, papers }: { course: Course; papers: Material[] }) {
  const [campus, setCampus] = useState(course.campus);
  const visible = papers.filter((paper) => paper.campus === campus);

  return (
    <div>
      <div role="group" aria-label="Campus" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {campuses.map((name) => {
          const count = papers.filter((paper) => paper.campus === name).length;
          const active = name === campus;
          return (
            <button
              key={name}
              onClick={() => setCampus(name)}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-[6px] border px-3 py-3 text-left transition ${active ? "border-[#2b2f6b] bg-[#2b2f6b] text-white shadow-[0_4px_12px_rgba(43,47,107,0.25)]" : "border-[#e3e3e3] bg-white hover:-translate-y-0.5 hover:border-[#2b2f6b] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${active ? "bg-white/15" : "bg-[#f1f2f8] text-[#2b2f6b]"}`}><Building2 size={18} /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold">{name}</span>
                <span className={`block text-[12px] ${active ? "text-[#c9cbe6]" : count ? "text-[#666]" : "text-[#999]"}`}>{count ? `${count} ${count === 1 ? "paper" : "papers"}` : "No papers yet"}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {visible.map((paper) => <PaperCard key={paper.id} paper={paper} course={course} />)}
        {visible.length === 0 && (
          <div className="rounded-[3px] border border-dashed border-[#cfcfcf] bg-white px-4 py-10 text-center text-[14px] text-[#666]">
            No {course.code} papers from the {campus} campus have been added yet.
          </div>
        )}
      </div>
    </div>
  );
}
