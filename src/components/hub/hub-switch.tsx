"use client";

import { BoxIcon, DatabaseIcon } from "lucide-react";

export type HubView = "models" | "datasets";

export function HubSwitch({
  view,
  onChange,
}: {
  view: HubView;
  onChange: (v: HubView) => void;
}) {
  return (
    <div className="relative grid h-10 grid-cols-2 rounded-full border-2 border-ink bg-paper p-1">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-exotic transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{ transform: view === "datasets" ? "translateX(100%)" : "translateX(0)" }}
      />
      <button
        type="button"
        aria-pressed={view === "models"}
        onClick={() => onChange("models")}
        className={`relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 font-sans text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
          view === "models" ? "text-paper" : "text-ink hover:text-exotic"
        }`}
      >
        <BoxIcon className="size-4 shrink-0" />
        Models
      </button>
      <button
        type="button"
        aria-pressed={view === "datasets"}
        onClick={() => onChange("datasets")}
        className={`relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 font-sans text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 ${
          view === "datasets" ? "text-paper" : "text-ink hover:text-exotic"
        }`}
      >
        <DatabaseIcon className="size-4 shrink-0" />
        Datasets
      </button>
    </div>
  );
}
