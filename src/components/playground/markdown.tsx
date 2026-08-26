"use client";

import { memo, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon, PanelRightIcon } from "lucide-react";

type Highlighter = Awaited<ReturnType<typeof import("shiki").createHighlighter>>;
let highlighterPromise: Promise<Highlighter> | null = null;
const htmlCache = new Map<string, string>();

function getHighlighter() {
  highlighterPromise ??= import("shiki").then((shiki) =>
    shiki.createHighlighter({
      themes: ["vesper"],
      langs: [
        "typescript", "javascript", "python", "bash", "json", "html",
        "css", "sql", "rust", "go", "markdown", "yaml", "tsx", "jsx",
      ],
    })
  );
  return highlighterPromise;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label="Copy code"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-paper/60 transition-none hover:text-exotic"
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, lang, onOpenArtifact }: { code: string; lang: string; onOpenArtifact?: (c: string, l: string) => void }) {
  const [html, setHtml] = useState<string | null>(htmlCache.get(`${lang}:${code}`) ?? null);
  const lines = code.split("\n").length;
  const known = lines > 30 && onOpenArtifact;

  useEffect(() => {
    if (html) return;
    let alive = true;
    void getHighlighter().then((h) => {
      if (!alive) return;
      const loaded = h.getLoadedLanguages().includes(lang as never) ? lang : "text";
      const out = h.codeToHtml(code, { lang: loaded, theme: "vesper" });
      htmlCache.set(`${lang}:${code}`, out);
      setHtml(out);
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, lang, html]);

  return (
    <div className="my-4 border-2 border-ink bg-[#101010]">
      <div className="flex items-center justify-between border-b border-paper/10 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-paper/40">{lang || "text"}</span>
        <div className="flex items-center gap-3">
          {known && (
            <button
              onClick={() => onOpenArtifact!(code, lang)}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-exotic transition-none hover:text-paper"
            >
              <PanelRightIcon className="size-3.5" />
              Artifact
            </button>
          )}
          <CopyBtn text={code} />
        </div>
      </div>
      {html ? (
        <div className="pg-shiki overflow-x-auto text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-paper/85">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

export const Markdown = memo(function Markdown({
  content,
  onOpenArtifact,
}: {
  content: string;
  onOpenArtifact?: (code: string, lang: string) => void;
}) {
  return (
    <div className="pg-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            const child = Array.isArray(children) ? children[0] : children;
            const el = child as { props?: { className?: string; children?: unknown } } | undefined;
            const className = el?.props?.className ?? "";
            const lang = /language-(\w+)/.exec(className)?.[1] ?? "";
            const raw = Array.isArray(el?.props?.children)
              ? (el!.props!.children as string[]).join("")
              : String(el?.props?.children ?? "");
            return <CodeBlock code={raw.replace(/\n$/, "")} lang={lang} onOpenArtifact={onOpenArtifact} />;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noreferrer" className="text-exotic underline decoration-2 underline-offset-2 hover:text-ink">
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto border-2 border-ink">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="border-b-2 border-ink bg-ink/5 px-3 py-2 text-left font-bold">{children}</th>;
          },
          td({ children }) {
            return <td className="border-b border-ink/10 px-3 py-2 align-top">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
