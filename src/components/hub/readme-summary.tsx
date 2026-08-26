"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReadmeSummary({ summary, title }: { summary: string; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = summary.length > 600;
  const shown = !expanded && long ? summary.slice(0, 600).replace(/\s\S*$/, "") + "…" : summary;
  return (
    <section className="border-2 border-ink/10 bg-paper p-6">
      <h2 className="label mb-3 text-ink/50">{title}</h2>
      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-a:text-exotic prose-a:underline prose-code:rounded prose-code:bg-ink/5 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-hr:border-ink/10 prose-li:marker:text-exotic prose-strong:text-ink">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{shown}</ReactMarkdown>
      </div>
      {long && (
        <button onClick={() => setExpanded((v) => !v)} className="label mt-4 text-exotic hover:underline">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </section>
  );
}
