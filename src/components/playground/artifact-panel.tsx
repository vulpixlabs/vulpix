"use client";

import { useMemo, useRef, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, EyeIcon, Trash2Icon, XIcon, CodeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayground } from "@/lib/playground/store";

export function ArtifactPanel() {
  const { artifact, setArtifact, removeArtifact } = usePlayground();
  const [previewToggle, setPreviewToggle] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const isHtmlDoc = useMemo(
    () =>
      artifact?.language === "html" ||
      /<!doctype html|<html[\s>]/i.test(artifact?.content ?? ""),
    [artifact]
  );
  const defaultPreview = artifact?.language === "markdown" || isHtmlDoc;
  const preview = previewToggle ?? defaultPreview;

  if (!artifact) return null;

  const srcDoc =
    artifact.kind === "code" && isHtmlDoc
      ? artifact.content
      : `<!doctype html><html><head><style>
          body{font-family:ui-monospace,monospace;font-size:13px;line-height:1.6;padding:16px;background:#fff;color:#000;white-space:pre-wrap;word-break:break-word}
        </style></head><body>${artifact.content.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c)}</body></html>`;

  const download = () => {
    const ext = artifact.language ? `.${artifact.language === "python" ? "py" : artifact.language === "typescript" || artifact.language === "tsx" ? "ts" : artifact.language}` : ".txt";
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "artifact"}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col border-l-2 border-ink bg-paper shadow-[-6px_0_0_0_rgba(0,0,0,0.08)]">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-ink px-4">
        <CodeIcon className="size-4 shrink-0 text-exotic" />
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{artifact.title}</p>
        {isHtmlDoc && (
          <button
            onClick={() => setPreviewToggle(!preview)}
            className={cn(
              "flex items-center gap-1 border px-2 py-1 text-[11px] font-bold uppercase transition-none",
              preview ? "border-exotic bg-exotic text-paper" : "border-ink/20 text-ink/60 hover:border-exotic hover:text-exotic"
            )}
          >
            <EyeIcon className="size-3.5" />
            {preview ? "Code" : "Preview"}
          </button>
        )}
        <button
          aria-label="Copy artifact"
          onClick={() => {
            void navigator.clipboard.writeText(artifact.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-ink/40 hover:text-exotic"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        </button>
        <button aria-label="Download artifact" onClick={download} className="text-ink/40 hover:text-exotic">
          <DownloadIcon className="size-4" />
        </button>
        <button
          aria-label="Delete artifact"
          onClick={() => {
            void removeArtifact(artifact.id);
          }}
          className="text-ink/40 hover:text-red-600"
        >
          <Trash2Icon className="size-4" />
        </button>
        <button aria-label="Close panel" onClick={() => setArtifact(null)} className="ml-1 text-ink/60 hover:text-ink">
          <XIcon className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {preview ? (
          <iframe
            ref={frameRef}
            title={artifact.title}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="size-full bg-white"
          />
        ) : (
          <pre className="p-4 font-mono text-[13px] leading-relaxed text-ink">
            <code>{artifact.content}</code>
          </pre>
        )}
      </div>
      <p className="shrink-0 border-t border-ink/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink/35">
        {artifact.language || "text"} · {artifact.content.split("\n").length} lines · saved locally
      </p>
    </div>
  );
}
