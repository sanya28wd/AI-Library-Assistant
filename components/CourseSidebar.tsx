"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import { courses } from "@/lib/seed";

export function CourseSidebar({ activeId }: { activeId: string }) {
  const [filter, setFilter] = useState("");
  const search = filter.toLowerCase().trim();
  const visible = courses.filter((course) => !search || `${course.code} ${course.name}`.toLowerCase().includes(search));

  return (
    <div className="px-3 py-4 sm:px-4">
      <label className="flex items-end gap-2 border-b border-[#e3e3e3] pb-4 text-[14px]">
        <span>Search:</span>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} className="min-w-0 flex-1 border-b border-[#bdbdbd] bg-transparent pb-0.5 outline-none focus:border-[#2b2f6b]" />
      </label>
      <ul className="mt-3 text-[14px]">
        {visible.map((course) => {
          const label = `${course.code} - ${course.campus} - ${course.name}`;
          return (
            <li key={course.id} className="border-b border-[#ececec]">
              {course.available
                ? <Link href={`/courses/${course.id}` as Route} className={`block px-2 py-2.5 hover:bg-[#f3f3f5] ${course.id === activeId ? "bg-[#e8e8eb] font-semibold" : ""}`}>{label}</Link>
                : <span className="flex items-center justify-between gap-2 px-2 py-2.5 text-[#9a9a9a]">{label}<span className="shrink-0 text-[11px]">No papers yet</span></span>}
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-2 py-3 text-[13px] text-[#777]">No courses match.</li>}
      </ul>
      <Link href="/admin" className="mt-6 inline-block px-2 text-[12px] text-[#777] hover:underline">Library staff: content review</Link>
    </div>
  );
}
