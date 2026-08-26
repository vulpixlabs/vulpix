"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command as CmdkRoot,
  CommandInput as CmdkInput,
  CommandList as CmdkList,
  CommandItem as CmdkItem,
} from "cmdk";
import {
  ArrowDownIcon,
  CornerDownLeftIcon,
  DownloadIcon,
  LoaderIcon,
  SearchIcon,
} from "lucide-react";
import type { HFModel } from "@/lib/hf";
import { Avatar } from "@/components/hub/model-card";

type Props = {
  variant?: "hero" | "hub";
  initialQuery?: string;
  placeholder?: string;
  onSubmit?: (q: string) => void;
};

export function SearchCommand({
  variant = "hero",
  initialQuery = "",
  placeholder = "Search models, datasets…",
  onSubmit,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<HFModel[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hi, setHi] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const term = q.trim();
      if (term.length < 2) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      fetch(`/api/hf/models?limit=6&q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((d) => {
          setItems(Array.isArray(d) ? d.slice(0, 6) : []);
          setLoading(false);
        })
        .catch(() => {
          setItems([]);
          setLoading(false);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showDrop =
    open && (q.trim().length >= 2 || loading || items.length > 0);

  const goAll = () => {
    setOpen(false);
    const term = q.trim();
    if (onSubmit) onSubmit(term);
    else router.push(`/hub?q=${encodeURIComponent(term)}`);
  };

  const goModel = (id: string) => {
    setOpen(false);
    router.push(`/hub/model/${encodeURIComponent(id)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hi >= 0 && items[hi]) goModel(items[hi].id);
      else goAll();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const shell =
    variant === "hero"
      ? "relative flex items-center gap-4 rounded-full border-2 border-ink bg-paper py-4 pl-7 pr-4 focus-within:border-exotic"
      : "relative flex items-center gap-3 border-2 border-ink bg-paper px-4 py-2.5 focus-within:border-exotic";

  return (
    <div
      ref={boxRef}
      className={
        variant === "hero" ? "hz-bar relative mt-10 w-full max-w-xl" : "relative z-30 w-full max-w-md"
      }
    >
      <CmdkRoot shouldFilter={false} className={shell}>
        {loading ? (
          <LoaderIcon className="size-5 shrink-0 animate-spin text-exotic" />
        ) : (
          <SearchIcon
            className={`shrink-0 ${variant === "hero" ? "size-5" : "size-4"} text-ink/40`}
          />
        )}
        <CmdkInput
          value={q}
          onValueChange={(v) => {
            setQ(v);
            setOpen(true);
            setHi(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search models and datasets"
          className={`w-full bg-transparent outline-none placeholder:text-ink/40 ${
            variant === "hero" ? "text-base" : "text-sm"
          }`}
        />
        {variant === "hero" && (
          <kbd className="hidden shrink-0 items-center gap-1 border border-ink/20 px-2 py-0.5 font-sans text-xs text-ink/40 sm:flex">
            <CornerDownLeftIcon className="size-3" /> Enter
          </kbd>
        )}

        {showDrop && (
          <CmdkList
            role="listbox"
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden border-2 border-ink bg-paper shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
          >
            {items.map((m, i) => (
              <CmdkItem
                key={m.id}
                value={m.id}
                onSelect={() => goModel(m.id)}
                onMouseEnter={() => setHi(i)}
                className={`flex cursor-pointer items-center gap-3 px-5 py-3 ${
                  hi === i ? "bg-exotic text-paper" : ""
                }`}
              >
                <Avatar
                  author={m.id.includes("/") ? m.id.split("/")[0] : undefined}
                  id={m.id}
                  className="size-7"
                />
                <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold">
                  {m.id}
                </span>
                <span
                  className={`flex shrink-0 items-center gap-1 text-xs ${
                    hi === i ? "text-paper/80" : "text-ink/50"
                  }`}
                >
                  <DownloadIcon className="size-3" />
                  {m.downloads != null
                    ? m.downloads >= 1_000_000
                      ? `${(m.downloads / 1e6).toFixed(1)}M`
                      : m.downloads >= 1_000
                        ? `${(m.downloads / 1e3).toFixed(1)}k`
                        : String(m.downloads)
                    : ""}
                </span>
              </CmdkItem>
            ))}
            {items.length === 0 && !loading && (
              <p className="px-5 py-4 text-sm text-ink/50">
                No direct matches, press Enter to search all models.
              </p>
            )}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                goAll();
              }}
              className="flex w-full cursor-pointer items-center justify-between border-t-2 border-ink/10 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-ink/50 transition-none hover:bg-exotic hover:text-paper"
            >
              See all results
              <span className="flex items-center gap-2 normal-case tracking-normal">
                <ArrowDownIcon className="size-3" />
                <CornerDownLeftIcon className="size-3" />
              </span>
            </button>
          </CmdkList>
        )}
      </CmdkRoot>

      {variant === "hero" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
        >
          <div className="star-orb star-orb-b absolute h-[50%] w-[200%] rounded-full opacity-80" />
          <div className="star-orb star-orb-t absolute h-[50%] w-[200%] rounded-full opacity-80" />
        </div>
      )}
    </div>
  );
}
