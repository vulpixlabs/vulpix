"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { PIPELINE_TAXONOMY, DATASET_TASKS, DATASET_MODALITIES } from "@/lib/hf";

const GROUP_DOT: Record<string, string> = {
  cv: "bg-sky-500",
  nlp: "bg-red-500",
  audio: "bg-emerald-500",
  tabular: "bg-violet-500",
  rl: "bg-amber-500",
};

function Pill({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-left text-xs font-medium leading-none transition-none ${
        active ? "border-exotic bg-exotic text-paper" : "border-ink/15 bg-paper text-ink hover:border-exotic hover:text-exotic"
      }`}
    >
      {dot && <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />}
      {children}
    </button>
  );
}

export function ModelsAdvancedSearch({
  task,
  setParams,
}: {
  task: string;
  setParams: (patch: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-ink/10 bg-paper">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <span className="label text-ink">Advanced search</span>
        <span className="flex items-center gap-2 text-xs font-semibold text-exotic">
          {open ? "Hide" : "Show all tasks"}
          <ChevronDownIcon className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-6 border-t border-ink/10 p-4">
            {PIPELINE_TAXONOMY.map((g) => (
              <div key={g.label}>
                <p className="label mb-2 flex items-center gap-2 text-ink/50">
                  <span className={`size-2 rounded-full ${GROUP_DOT[g.color] ?? "bg-ink/20"}`} />
                  {g.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map(([v, l]) => (
                    <Pill key={v} active={task === v} dot={GROUP_DOT[g.color]} onClick={() => setParams({ task: task === v ? "" : v })}>
                      {l}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DatasetsAdvancedSearch({
  task,
  modality,
  setParams,
}: {
  task: string;
  modality: string;
  setParams: (patch: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-ink/10 bg-paper">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <span className="label text-ink">Advanced search</span>
        <span className="flex items-center gap-2 text-xs font-semibold text-exotic">
          {open ? "Hide" : "Show all"}
          <ChevronDownIcon className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-ink/10 p-4">
            <div>
              <p className="label mb-2 text-ink/50">Tasks</p>
              <div className="flex flex-wrap gap-1.5">
                {DATASET_TASKS.map(([v, l]) => (
                  <Pill key={v} active={task === v} onClick={() => setParams({ task: task === v ? "" : v })}>
                    {l}
                  </Pill>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-2 text-ink/50">Modalities</p>
              <div className="flex flex-wrap gap-1.5">
                {DATASET_MODALITIES.map(([v, l]) => (
                  <Pill key={v} active={modality === v} onClick={() => setParams({ modality: modality === v ? "" : v })}>
                    {l}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
