"use client";

import { FormEvent, Fragment, useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { FileText, Loader2, MessageCircle, Send, X } from "lucide-react";
import { chatSuggestions, sourcePath } from "@/lib/seed";
import { staticDemo } from "@/lib/site";
import { ChatMessage, ChatResponse, ChatSource, Course } from "@/lib/types";

type Turn = ChatMessage & { sources?: ChatSource[]; mode?: ChatResponse["mode"] };

// Turns "[2]" in an answer into a link to that source's page.
// Answers are plain text with **bold**, [n] citations and LaTeX maths; anything else stays literal, so model output is never rendered as raw HTML.
function withCitations(text: string, sources: ChatSource[]): React.ReactNode[] {
  return text.replace(/^#{1,6}\s+/gm, "").split(/(\[\d+\]|\*\*[^*\n]+\*\*)/g).map((part, index) => {
    if (/^\*\*[^*\n]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    const source = sources.find((item) => `[${item.id}]` === part);
    if (!source) return part;
    return <a key={index} href={source.href} target="_blank" rel="noreferrer" title={`${source.label}${source.page ? `, page ${source.page}` : ""}`} className="mx-0.5 rounded-[3px] bg-[#e6f3f5] px-1 text-[11px] font-semibold text-[#1b6f7c] no-underline hover:bg-[#cfe9ed]">{source.id}</a>;
  });
}

// \( \) and \[ \] are what the model emits; $$ $$ is a common fallback. Single $ is left alone because answers mention money.
const mathPattern = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$)/g;

const isDisplayMath = (part = ""): boolean => part.startsWith("\\[") || part.startsWith("$$");

function renderAnswer(text: string, sources: ChatSource[]): React.ReactNode[] {
  const parts = text.split(mathPattern);
  return parts.map((part, index) => {
    const display = isDisplayMath(part);
    if (!(display || part.startsWith("\\("))) {
      // A displayed equation is already its own block, so the line breaks around it would double the gap.
      const trimmed = part.replace(isDisplayMath(parts[index - 1]) ? /^[ \t]*\n/ : /^$/, "").replace(isDisplayMath(parts[index + 1]) ? /\n[ \t]*$/ : /^$/, "");
      return <Fragment key={index}>{withCitations(trimmed, sources)}</Fragment>;
    }
    // KaTeX escapes its input and, with trust off, emits only its own markup.
    const html = katex.renderToString(part.slice(2, -2), { displayMode: display, throwOnError: false, trust: false });
    return <span key={index} className={display ? "my-1 block overflow-x-auto" : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export function ChatWidget({ course }: { course: Course }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const suggestions = chatSuggestions[course.id] ?? [];

  // Show the start of a new answer rather than the bottom of its source list.
  useEffect(() => {
    const container = scroller.current;
    const last = [...(container?.querySelectorAll<HTMLElement>("[data-turn]") ?? [])].at(-1);
    if (!container) return;
    const top = turns.at(-1)?.role === "assistant" && last ? last.offsetTop - 12 : container.scrollHeight;
    container.scrollTo({ top, behavior: "smooth" });
  }, [turns, loading]);

  async function ask(question: string): Promise<void> {
    const text = question.trim();
    if (!text || loading) return;
    const history: Turn[] = [...turns, { role: "user", content: text }];
    setTurns(history);
    setDraft("");
    setError("");
    if (staticDemo) {
      setTurns([...history, { role: "assistant", content: "The study assistant needs the server version of this site, which can search the papers and call the AI model. This GitHub Pages demo is static, so it can't answer questions. Run the project locally with an OpenAI key to try it." }]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, messages: history.map(({ role, content }) => ({ role, content })) })
      });
      const body = await response.json() as ChatResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");
      setTurns([...history, { role: "assistant", content: body.answer, sources: body.sources, mode: body.mode }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <>
      {open && (
        <section aria-label={`${course.code} study assistant`} className="fixed inset-x-2 bottom-24 top-4 z-30 flex flex-col overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:right-6 sm:top-auto sm:h-[min(600px,calc(100vh-8rem))] sm:w-[400px]">
          <header className="flex items-start justify-between gap-3 bg-[#2b2f6b] px-4 py-3 text-white">
            <div>
              <p className="text-[15px] font-semibold">{course.code} Study Assistant</p>
              <p className="text-[12px] text-[#c9cbe6]">Answers from the course handout, past papers and answer keys</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close study assistant" className="mt-0.5 text-[#c9cbe6] hover:text-white"><X size={18} /></button>
          </header>

          <div ref={scroller} className="relative flex-1 space-y-4 overflow-y-auto bg-[#fafafa] px-4 py-4">
            {turns.length === 0 && (
              <div className="text-[13px] text-[#444]">
                <p>Ask about any {course.name} concept or past exam question. Every answer links to the paper or handout page it comes from.</p>
                <div className="mt-3 flex flex-col items-start gap-2">
                  {suggestions.map((suggestion) => <button key={suggestion} onClick={() => void ask(suggestion)} className="rounded-[3px] border border-[#d6d6d6] bg-white px-2.5 py-1.5 text-left hover:border-[#2b2f6b]">{suggestion}</button>)}
                </div>
              </div>
            )}

            {turns.map((turn, index) => turn.role === "user"
              ? <div key={index} data-turn className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-[4px] bg-[#2b2f6b] px-3 py-2 text-[14px] text-white">{turn.content}</div>
              : (
                <div key={index} data-turn className="max-w-[95%] text-[14px] leading-6">
                  <div className="whitespace-pre-wrap rounded-[4px] border border-[#e5e5e5] bg-white px-3 py-2">{renderAnswer(turn.content, turn.sources ?? [])}</div>
                  {turn.mode === "ai" && <p className="mt-1 text-[11px] text-[#888]">Sentences with a numbered link come from your course material. Anything without one is a general explanation.</p>}
                  {turn.sources && turn.sources.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#777]">Sources</p>
                      {turn.sources.map((source) => (
                        <div key={source.id}>
                        <a href={source.href} target="_blank" rel="noreferrer" className="block rounded-[3px] border border-[#ececec] bg-white px-2.5 py-1.5 text-[12px] hover:border-[#1b8a9b]">
                          <span className="flex items-center gap-1.5 font-semibold text-[#1f2328]"><span className="text-[#1b6f7c]">[{source.id}]</span><FileText size={12} className="shrink-0 text-[#777]" />{source.label}{source.page ? ` · page ${source.page}` : ""}</span>
                          {turn.mode === "sources-only" && <span className="mt-1 line-clamp-3 text-[#555]">{source.excerpt}</span>}
                        </a>
                        {source.visuals && source.visuals.length > 0 && <details className="rounded-[3px] border border-[#d6e8eb] bg-white p-2 text-[12px]">
                          <summary className="cursor-pointer font-semibold text-[#1b6f7c]">[{source.id}] View graph and question context</summary>
                          {source.visuals?.map((visual) => <figure key={visual.caption} className="mt-2">
                            <figcaption className="font-semibold">{visual.caption}</figcaption>
                            <p className="my-2 leading-5">{visual.description}</p>
                            <a href={sourcePath(visual.fileName)} target="_blank" rel="noreferrer" aria-label={`Open source image: ${visual.caption}`}><img src={sourcePath(visual.fileName)} alt={`${visual.caption}. Inputs are transcribed above.`} loading="lazy" className="h-auto w-full" /></a>
                          </figure>)}
                        </details>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {loading && <p className="flex items-center gap-2 text-[13px] text-[#666]"><Loader2 size={14} className="animate-spin" />Searching course material…</p>}
            {error && <p className="text-[13px] text-[#b42318]">{error}</p>}
          </div>

          <form onSubmit={submit} className="border-t border-[#e5e5e5] bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(draft); } }}
                rows={2}
                maxLength={1500}
                placeholder="Ask about a concept or past question…"
                className="min-h-[44px] flex-1 resize-none rounded-[3px] border border-[#cfcfcf] px-2.5 py-2 text-[14px] outline-none focus:border-[#2b2f6b]"
              />
              <button type="submit" disabled={!draft.trim() || loading} aria-label="Send" className="grid h-[44px] w-[44px] place-items-center rounded-[3px] bg-[#2b2f6b] text-white disabled:opacity-40"><Send size={17} /></button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#888]">Check answers against the linked source. Your chat is not saved.</p>
          </form>
        </section>
      )}

      <button onClick={() => setOpen((current) => !current)} aria-label={open ? "Close study assistant" : "Open study assistant"} title="Ask the study assistant" className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#1d8fe1] text-white shadow-[0_6px_18px_rgba(0,0,0,0.25)] hover:bg-[#1479c2]">
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>
    </>
  );
}
