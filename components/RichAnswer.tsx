"use client";

import { Fragment } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { ChatSource } from "@/lib/types";

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

const tableRow = /^\s*\|.*\|\s*$/;
const separatorRow = /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-*:?\s*\|?\s*$/;

function cells(row: string): string[] {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

// Models sometimes answer with a Markdown table despite the prompt; show it as a real table rather than raw pipes.
function renderTable(lines: string[], sources: ChatSource[], key: number): React.ReactNode {
  const rows = lines.filter((line) => !separatorRow.test(line)).map(cells);
  const [head, ...body] = rows;
  return (
    <span key={key} className="my-2 block overflow-x-auto">
      <table className="border-collapse text-[13px]">
        <thead><tr>{head.map((cell, index) => <th key={index} className="border border-[#d5dbe3] bg-[#eef3f7] px-2 py-1 text-left font-semibold">{renderAnswer(cell, sources)}</th>)}</tr></thead>
        <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index} className="border border-[#d5dbe3] px-2 py-1">{renderAnswer(cell, sources)}</td>)}</tr>)}</tbody>
      </table>
    </span>
  );
}

/** Renders model output: [n] citations as source links, **bold**, LaTeX maths and simple Markdown tables. */
export function RichAnswer({ text, sources }: { text: string; sources: ChatSource[] }) {
  const blocks: { table: boolean; lines: string[] }[] = [];
  // Drop Markdown dividers and collapse runs of blank lines, which read as gaps in pre-wrapped text.
  const tidy = text.replace(/^[ \t]*([-*_])\1{2,}[ \t]*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  for (const line of tidy.split("\n")) {
    const table = tableRow.test(line);
    const last = blocks.at(-1);
    if (last && last.table === table) last.lines.push(line);
    else blocks.push({ table, lines: [line] });
  }
  return (
    <>
      {blocks.map((block, index) => block.table && block.lines.length >= 2
        ? renderTable(block.lines, sources, index)
        : <Fragment key={index}>{renderAnswer(block.lines.join("\n") + (index < blocks.length - 1 && !blocks[index + 1].table ? "\n" : ""), sources)}</Fragment>)}
    </>
  );
}
