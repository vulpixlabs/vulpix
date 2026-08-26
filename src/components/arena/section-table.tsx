"use client";

import type { ReactNode } from "react";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface SectionRow {
  label: string;
  tip?: string;
  cells: ReactNode[];
}

interface SectionTableProps {
  title: string;
  columns: number;
  rows: SectionRow[];
  className?: string;
  children?: ReactNode;
}

export function SectionTable({ title, columns, rows, className, children }: SectionTableProps) {
  return (
    <section className={`arena-section ${className ?? ""}`}>
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {children}
      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[640px]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid border-t border-ink/8"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {row.cells.map((cell, c) => (
                <div
                  key={c}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
                    c > 0 ? "border-l border-ink/8" : ""
                  }`}
                >
                  <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink/55">
                    {row.label}
                    {row.tip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" aria-label={`Info ${row.label}`} className="text-ink/35 hover:text-ink/60">
                            <InfoIcon className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-none border-2 border-ink text-xs">
                          {row.tip}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                  <span className="min-w-0 truncate text-right text-sm font-medium tabular-nums text-ink">
                    {cell}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CheckMark({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex items-center">
      <svg viewBox="0 0 20 20" className="size-4 fill-exotic" aria-label="Didukung">
        <path d="M10 0a10 10 0 1 0 0 20A10 10 0 0 0 10 0Zm4.7 7.7-5.2 5.2a1 1 0 0 1-1.4 0L5.3 10.1a1 1 0 0 1 1.4-1.4l2.1 2.1 4.5-4.5a1 1 0 0 1 1.4 1.4Z" />
      </svg>
    </span>
  ) : (
    <span className="inline-flex items-center text-ink/35" aria-label="Tidak didukung">
      <svg viewBox="0 0 20 20" className="size-4 fill-current">
        <path d="M10 0a10 10 0 1 0 0 20A10 10 0 0 0 10 0Zm3.5 12.1a1 1 0 0 1-1.4 1.4L10 11.4l-2.1 2.1a1 1 0 0 1-1.4-1.4L8.6 10 6.5 7.9A1 1 0 0 1 7.9 6.5L10 8.6l2.1-2.1a1 1 0 0 1 1.4 1.4L11.4 10l2.1 2.1Z" />
      </svg>
    </span>
  );
}

export function Dash() {
  return <span className="text-ink/30">-</span>;
}
