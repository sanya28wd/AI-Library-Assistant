import { existsSync } from "node:fs";
import { join } from "node:path";
import { basePath } from "@/lib/site";

const pattern = "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px)";

// Drop a photo at public/library-banner.jpg to replace the placeholder pattern.
export function CourseBanner({ title, compact = false }: { title: string; compact?: boolean }) {
  const photo = existsSync(join(process.cwd(), "public", "library-banner.jpg"));
  return (
    <div className={`grid place-items-center bg-[#25304f] bg-cover bg-center px-4 ${compact ? "h-28" : "h-32 sm:h-[125px]"}`} style={{ backgroundImage: photo ? `url(${basePath}/library-banner.jpg)` : pattern }}>
      <h1 className="bg-[#1b8a9b]/90 px-2 py-0.5 text-center text-xl font-semibold text-white sm:text-[22px]">{title}</h1>
    </div>
  );
}
