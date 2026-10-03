import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { staticDemo } from "@/lib/site";
import { Course } from "@/lib/types";

const navItems = ["Home", "About Us", "Services", "E-Resources", "Space Booking", "All Campuses"];

// "overlay" lays a transparent white header over the first section, like the library homepage hero.
export function LibraryShell({ children, chatCourse, variant = "default" }: { children: React.ReactNode; chatCourse?: Course; variant?: "default" | "overlay" }) {
  const overlay = variant === "overlay";
  return (
    <div className="min-h-screen bg-white text-[#1f2328]">
      {staticDemo && <p className="bg-[#fff4d6] px-4 py-1.5 text-center text-[12px] text-[#5c4400] sm:px-6">Student prototype for the BITS Pilani library, not the official library website. Static demo: the chatbot and notice file upload need the full version.</p>}
      <div className="bg-[#f1f1f1] px-4 py-2.5 text-[13px] leading-6 text-[#1f2328] sm:px-6">
        <p>Library is open currently <span className="ml-3 font-semibold">Opening Time:</span> 09:00 AM <span className="ml-3 font-semibold">Closing Time:</span> 06:00 AM</p>
        <p className="hidden sm:block"><span className="font-semibold">Saturday:</span> 09:00 AM - 06:00 AM <span className="mx-1 text-slate-400">|</span> <span className="font-semibold">Sunday:</span> 09:00 AM - 06:00 AM <span className="mx-1 text-slate-400">|</span> <span className="font-semibold">Monday:</span> 09:00 AM - 06:00 AM</p>
      </div>

      <div className={overlay ? "relative" : undefined}>
      <header className={overlay ? "absolute inset-x-0 top-0 z-20 text-white" : "border-b border-[#d0d0d0] bg-white"}>
        <div className={`flex items-center justify-between gap-4 px-4 py-3 sm:px-8 ${overlay ? "mx-4 border-b border-white/60 sm:mx-8 sm:px-0" : ""}`}>
          <Link href="/" className="flex items-center gap-3">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 ${overlay ? "border-white" : "border-[#2b2f6b] text-[#2b2f6b]"}`}><BookOpen size={22} /></span>
            <span className="text-[12px] leading-[17px]"><span className="block text-[13px] font-semibold">BITS Pilani</span>Dubai Campus<br />Library</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[14px] font-semibold lg:flex">
            {navItems.map((item) => item === "Home" ? <Link key={item} href="/" className={overlay ? "underline underline-offset-4" : "hover:text-[#2b2f6b]"}>{item}</Link> : <a key={item} href="#" className={overlay ? "hover:underline hover:underline-offset-4" : "hover:text-[#2b2f6b]"}>{item}</a>)}
          </nav>
          <div className="flex items-center gap-3 text-[14px]">
            <span className="hidden sm:inline">Welcome STUDENT</span>
            <button aria-label="Log out" className="grid h-8 w-8 place-items-center rounded-sm bg-[#2b2f6b] text-white"><LogOut size={15} /></button>
          </div>
        </div>
      </header>

      {children}
      </div>

      {chatCourse && <ChatWidget course={chatCourse} />}
    </div>
  );
}

export function TwoColumn({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid lg:grid-cols-[minmax(280px,33%)_1fr]">
      <aside className="border-b border-[#e3e3e3] lg:border-b-0 lg:border-r">{sidebar}</aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
