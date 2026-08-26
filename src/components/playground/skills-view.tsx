"use client";

import { ArrowLeftIcon, ZapIcon } from "lucide-react";
import { usePlayground } from "@/lib/playground/store";
import { SKILLS } from "@/lib/playground/skills";

export function SkillsView({ onBack }: { onBack: () => void }) {
  const { newChat } = usePlayground();
  const start = (skillId: string) => {
    newChat();
    window.dispatchEvent(new CustomEvent("pg:skill", { detail: skillId }));
    onBack();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ink/10 px-4">
        <button onClick={onBack} aria-label="Back" className="text-ink/50 hover:text-exotic">
          <ArrowLeftIcon className="size-4" />
        </button>
        <p className="text-sm font-bold">Skills</p>
        <span className="text-xs text-ink/40">type / in the composer anytime</span>
      </header>
      <div className="mx-auto w-full max-w-[900px] p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {SKILLS.map((s) => (
            <button
              key={s.id}
              onClick={() => start(s.id)}
              className="group border-2 border-ink/10 p-4 text-left transition-none hover:border-exotic"
            >
              <div className="flex items-center gap-2">
                <ZapIcon className="size-4 shrink-0 text-exotic" />
                <p className="truncate text-sm font-bold">/{s.id}</p>
                <span className="ml-auto shrink-0 font-mono text-[10px] text-ink/35">{s.source}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{s.description}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink/35 group-hover:text-exotic">
                Start chat →
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
