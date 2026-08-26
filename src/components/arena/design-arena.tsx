"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dash } from "@/components/arena/section-table";
import { matchKey } from "@/lib/arena-format";

export interface DAScore {
  elo: number;
  winRate: number;
  avgGenMs: number | null;
}

interface DesignArenaProps {
  da: Record<string, Record<string, DAScore>>;
  selected: { id: string; name: string }[];
  columns: number;
}

const CATEGORY_MAP: [string, string][] = [
  ["3d", "3D"],
  ["asciiart", "Asciiart"],
  ["codecategories", "Code Categories"],
  ["dataviz", "Data Visualization"],
  ["gamedev", "Game Development"],
  ["svg", "SVG"],
  ["uicomponent", "UI Component"],
  ["website", "Website"],
];

export function DesignArena({ da, selected, columns }: DesignArenaProps) {
  const [mode, setMode] = useState("table");

  const categories = CATEGORY_MAP.filter(([key]) =>
    selected.some((s) => matchKey(da, s.id)?.[key] != null),
  );

  const cell = (slug: string, cat: string) => {
    const hit = matchKey(da, slug)?.[cat];
    if (!hit) return <Dash />;
    return (
      <span className="flex items-baseline gap-2">
        <span className="font-semibold tabular-nums">{Math.round(hit.elo)}</span>
        <span className="text-xs font-medium tabular-nums text-exotic">{Math.round(hit.winRate)}%</span>
      </span>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-ink">Design Arena</h3>
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="h-7 rounded-none">
            <TabsTrigger value="table" className="h-7 rounded-none px-3 text-xs">Table</TabsTrigger>
            <TabsTrigger value="graph" className="h-7 rounded-none px-3 text-xs">Graph</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 border border-ink/10 px-4 py-6 text-center text-sm text-ink/45">
          No Design Arena data for the selected models yet.
        </p>
      ) : mode === "table" ? (
        <div className="mt-3 overflow-x-auto">
          <div className="min-w-[640px]">
            {categories.map(([key, label]) => (
              <div
                key={key}
                className="grid border-t border-ink/8"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {selected.map((s, c) => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
                      c > 0 ? "border-l border-ink/8" : ""
                    }`}
                  >
                    <span className="shrink-0 text-sm text-ink/55">{label}</span>
                    <span className="text-sm tabular-nums">{cell(s.id, key)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="mt-3 grid gap-6"
          style={{ gridTemplateColumns: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))` }}
        >
          {selected.map((s) => (
            <div key={s.id} className="border border-ink/10 p-4">
              <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
              <div className="mt-3 space-y-2.5">
                {categories.map(([key, label]) => {
                  const hit = matchKey(da, s.id)?.[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-xs text-ink/55">{label}</span>
                      <div className="h-1.5 min-w-0 flex-1 bg-ink/8">
                        {hit && (
                          <div
                            className="h-full bg-exotic transition-all duration-700"
                            style={{ width: `${Math.min(hit.winRate, 100)}%` }}
                          />
                        )}
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-ink">
                        {hit ? Math.round(hit.elo) : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
