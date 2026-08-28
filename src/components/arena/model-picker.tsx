"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { openRouterModelLogo } from "@/lib/brand-logos";
import { monthLabel } from "@/lib/arena-format";
import { LogoMark } from "@/components/ui/logo-mark";

export interface ModelOption {
  id: string;
  name: string;
  created: number | null;
}

interface ModelPickerProps {
  models: ModelOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelPicker({ models, selectedId, onSelect, open, onOpenChange }: ModelPickerProps) {
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { y: 8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.22, ease: "power3.out" },
      );
    }
    const close = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setQuery("");
        onOpenChange(false);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuery("");
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open, onOpenChange]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      : models;
    const map = new Map<string, ModelOption[]>();
    for (const m of filtered) {
      const label =
        m.created && m.created > 0
          ? monthLabel(m.created * 1000)
          : "Earlier";
      const list = map.get(label) ?? [];
      list.push(m);
      map.set(label, list);
    }
    return Array.from(map.entries());
  }, [models, query]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute left-0 right-0 top-full z-50 mt-2 border-2 border-ink bg-paper shadow-[6px_6px_0_0_#000]"
      role="listbox"
      aria-label="Pilih model"
    >
      <div className="flex items-center gap-2 border-b border-ink/10 px-3 py-2.5">
        <SearchIcon className="size-4 shrink-0 text-ink/40" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
        />
        <span className="shrink-0 text-xs tabular-nums text-ink/45">{models.length} models</span>
        <SlidersHorizontalIcon className="size-4 shrink-0 text-ink/40" />
      </div>
      <ScrollAreaStyled>
        {groups.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink/45">No models match &ldquo;{query}&rdquo;.</p>
        )}
        {groups.map(([label, items]) => (
          <div key={label}>
            <p className="sticky top-0 bg-paper px-3 py-2 text-xs font-medium text-ink/45">{label}</p>
            {items.map((m) => {
              const active = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelect(m.id);
                    setQuery("");
                    onOpenChange(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-exotic/10 font-semibold text-ink" : "text-ink hover:bg-exotic hover:text-paper"
                  }`}
                >
                  <LogoMark
                    name={m.id.split("/")[0] ?? m.name}
                    src={openRouterModelLogo(m.id)}
                    className="size-4 text-[7px]"
                    fallbackClassName="border border-ink/10 bg-paper text-ink"
                  />
                  <span className="truncate">{m.name}</span>
                  {active && <CheckIcon className="ml-auto size-3.5 shrink-0 text-exotic" />}
                </button>
              );
            })}
          </div>
        ))}
      </ScrollAreaStyled>
    </div>
  );
}

function ScrollAreaStyled({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-[320px] overflow-y-auto overscroll-contain" data-slot="scroll-area">
      {children}
    </div>
  );
}

export function PickerTrigger({
  icon,
  name,
  onClick,
}: {
  icon: string;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 items-center gap-2.5 py-0.5 text-left"
      aria-haspopup="listbox"
    >
      <LogoMark
        name={name.split(" ")[0] ?? name}
        src={icon}
        className="size-5 text-[8px]"
        fallbackClassName="border border-ink/10 bg-paper text-ink"
        loading="eager"
      />
      <span className="truncate text-sm font-semibold text-ink">{name}</span>
      <ChevronDownIcon className="size-4 shrink-0 text-ink/50" />
    </button>
  );
}
