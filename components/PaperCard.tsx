import { FileText, KeyRound } from "lucide-react";
import { materialForId, paperTitle, sourcePath } from "@/lib/seed";
import { Course, Material } from "@/lib/types";

export function PaperCard({ paper, course }: { paper: Material; course: Course }) {
  const key = paper.answerKeyId ? materialForId(paper.answerKeyId) : undefined;
  const href = sourcePath(paper.fileName);
  const bundle = (paper.sections?.length ?? 0) > 1 ? paper.sections! : [];
  const note = paper.sections?.length === 1 ? paper.sections[0].note : undefined;
  return (
    <div className="rounded-[3px] border border-[#ececec] bg-white px-3 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition hover:shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
      <div className="flex items-center justify-between gap-4">
        <a href={href} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">{paperTitle(paper)}{note && <span className="ml-2 text-[12px] font-normal text-[#1b6f7c]">with {note}</span>}</p>
          <p className="mt-0.5 text-[13px]">({course.code}) {course.name} {paper.campus}</p>
        </a>
        <div className="flex shrink-0 items-center gap-4 text-[13px] text-[#2b2f6b]">
          {key && <a href={sourcePath(key.fileName)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline"><KeyRound size={14} />Answer key</a>}
          <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${paperTitle(paper)}`} className="text-[#777] hover:text-[#2b2f6b]"><FileText size={17} /></a>
        </div>
      </div>
      {bundle.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-1 gap-y-1 text-[13px]">
          {bundle.map((section, index) => (
            <span key={section.startPage} className="inline-flex items-center">
              {index > 0 && <span className="mr-1 text-[#bbb]">·</span>}
              <a href={`${href}#page=${section.startPage}`} target="_blank" rel="noreferrer" className="text-[#2b2f6b] hover:underline">{section.label}</a>
              {section.note && <span className="ml-1 text-[12px] text-[#1b6f7c]">(+{section.note})</span>}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
