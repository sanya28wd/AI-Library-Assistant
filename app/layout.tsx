import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BPD Study Library",
  description: "Topic-based past-paper search for BITS Pilani Dubai"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
