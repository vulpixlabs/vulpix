"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import {
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  GlobeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/playground/markdown";

export interface ThinkSegment {
  kind: "think" | "text";
  content: string;
}

export function parseThink(text: string): ThinkSegment[] {
  const segments: ThinkSegment[] = [];
  let rest = text;
  for (;;) {
    const start = rest.indexOf("<think>");
    if (start === -1) {
      if (rest) segments.push({ kind: "text", content: rest });
      break;
    }
    if (start > 0) segments.push({ kind: "text", content: rest.slice(0, start) });
    const close = rest.indexOf("</think>", start);
    if (close === -1) {
      segments.push({ kind: "think", content: rest.slice(start + 7) });
      break;
    }
    segments.push({ kind: "think", content: rest.slice(start + 7, close) });
    rest = rest.slice(close + 8);
  }
  return segments;
}

function ThinkingBlock({ content, streaming }: { content: string; streaming: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 border border-ink/15 bg-ink/[0.03]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-ink/50 transition-none hover:text-exotic"
      >
        <BrainIcon className={cn("size-3.5 shrink-0", streaming && "animate-pulse text-exotic")} />
        <span>{streaming ? "Thinking…" : "Thought process"}</span>
        <ChevronDownIcon
          className={cn("ml-auto size-3.5 shrink-0 transition-none", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="max-h-[320px] overflow-y-auto border-t border-ink/10 px-3 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-ink/55">
          {content.trim()}
        </div>
      )}
    </div>
  );
}

function textOf(m: UIMessage): string {
  return m.parts
    ?.filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("") ?? "";
}

function reasoningOf(m: UIMessage): string {
  return m.parts
    ?.filter((p) => p.type === "reasoning")
    .map((p) => (p as { text?: string }).text ?? "")
    .join("\n") ?? "";
}

function ActionBar({
  text,
  onRegenerate,
}: {
  text: string;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const btn =
    "text-ink/40 transition-none hover:text-exotic disabled:opacity-30 disabled:hover:text-ink/40";
  return (
    <div className="mt-2 flex items-center gap-3 opacity-0 transition-none group-hover:opacity-100 focus-within:opacity-100">
      <button
        aria-label="Copy message"
        className={btn}
        onClick={() => {
          void navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </button>
      {onRegenerate && (
        <button aria-label="Regenerate" className={btn} onClick={onRegenerate}>
          <RefreshCwIcon className="size-4" />
        </button>
      )}
      <button
        aria-label="Good response"
        className={cn(btn, vote === "up" && "text-exotic")}
        onClick={() => setVote(vote === "up" ? null : "up")}
      >
        <ThumbsUpIcon className="size-4" />
      </button>
      <button
        aria-label="Bad response"
        className={cn(btn, vote === "down" && "text-exotic")}
        onClick={() => setVote(vote === "down" ? null : "down")}
      >
        <ThumbsDownIcon className="size-4" />
      </button>
    </div>
  );
}

export function Message({
  message,
  isLast,
  streaming,
  thinking,
  onRegenerate,
  onEdit,
  onOpenArtifact,
}: {
  message: UIMessage;
  isLast: boolean;
  streaming: boolean;
  thinking: boolean;
  onRegenerate: () => void;
  onEdit: (text: string) => void;
  onOpenArtifact?: (code: string, lang: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const raw = textOf(message);
  const segments = parseThink(raw);
  const reasoning = reasoningOf(message);
  const thinkContent = [reasoning, ...segments.filter((s) => s.kind === "think").map((s) => s.content)]
    .filter(Boolean)
    .join("\n\n");
  const body = segments
    .filter((s) => s.kind === "text")
    .map((s) => s.content)
    .join("")
    .trim();
  const thinkStreaming = segments.some((s) => s.kind === "think") && !segments[segments.length - 1]?.content.includes("</think>") && raw.includes("<think>") && !raw.includes("</think>");
  const isUser = message.role === "user";
  const showCaret = streaming && isLast && !thinking;

  if (isUser) {
    return (
      <div className="group flex flex-col items-end">
        {editing ? (
          <div className="w-full max-w-[720px]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(8, draft.split("\n").length + 1)}
              className="w-full resize-none border-2 border-exotic bg-paper p-3 text-sm outline-none"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="border-2 border-ink/20 px-3 py-1 text-xs font-semibold text-ink/60 hover:border-ink hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  if (draft.trim()) onEdit(draft.trim());
                }}
                className="border-2 border-exotic bg-exotic px-3 py-1 text-sm font-bold text-paper hover:border-ink hover:bg-ink"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-[85%] border-2 border-ink/15 bg-ink/[0.04] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
              {body}
            </div>
            <div className="mt-1 flex items-center gap-3 opacity-0 transition-none group-hover:opacity-100">
              <button
                aria-label="Edit message"
                className="text-ink/40 hover:text-exotic"
                onClick={() => {
                  setDraft(body);
                  setEditing(true);
                }}
              >
                <PencilIcon className="size-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="group">
      <div className="max-w-[720px] text-[15px] leading-[1.7]">
        {thinkContent && <ThinkingBlock content={thinkContent} streaming={thinkStreaming} />}
        {body ? (
          <>
            <Markdown content={body} onOpenArtifact={onOpenArtifact} />
            {showCaret && <span className="pg-caret" />}
          </>
        ) : (
          showCaret && <span className="pg-caret" />
        )}
      </div>
      {message.parts?.some((p) => p.type.startsWith("tool-")) && (
        <div className="mt-2 space-y-1.5">
          {message.parts
            .filter((p) => p.type.startsWith("tool-"))
            .map((p, i) => {
              const state = (p as { state?: string }).state ?? "";
              const input = (p as { input?: { query?: string } }).input;
              const running = state === "input-streaming" || state === "input-available";
              return (
                <div
                  key={i}
                  className="flex max-w-[720px] items-center gap-2 border border-ink/15 bg-ink/[0.03] px-3 py-1.5 text-xs text-ink/60"
                >
                  <GlobeIcon className={cn("size-3.5 shrink-0", running && "text-exotic")} />
                  <span className="truncate">
                    {running ? "Searching the web" : "Searched the web"}
                    {input?.query ? `: "${input.query}"` : "…"}
                  </span>
                  {running && <span className="ml-auto size-2 shrink-0 animate-pulse rounded-full bg-exotic" />}
                </div>
              );
            })}
        </div>
      )}
      {!streaming && body && <ActionBar text={body} onRegenerate={isLast ? onRegenerate : undefined} />}
    </div>
  );
}
