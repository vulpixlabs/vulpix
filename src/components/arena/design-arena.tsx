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
        <div className="mt-3 border border-ink/10 bg-paper p-4">
          {(() => {
            const HIGHLIGHTS = ["#F54F1B", "#FF8C4A", "#FFB37F", "#FFD1AD"];
            const pieData = selected.map((s, i) => {
              const hits = categories.map(([k]) => matchKey(da, s.id)?.[k]).filter(Boolean) as DAScore[];
              const avg = hits.length ? hits.reduce((a, b) => a + b.winRate, 0) / hits.length : 0;
              return { id: s.id, name: s.name, value: avg, color: HIGHLIGHTS[i % HIGHLIGHTS.length] };
            });
            const total = pieData.reduce((a, b) => a + b.value, 0) || 1;
            let acc = 0;
            const slices = pieData.map((d) => {
              const start = acc;
              const angle = (d.value / total) * 360;
              acc += angle;
              return { ...d, start, angle };
            });
            const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
            const polar = (cx: number, cy: number, r: number, deg: number) => ({
              x: cx + r * Math.cos(toRad(deg)),
              y: cy + r * Math.sin(toRad(deg)),
            });
            const describe = (cx: number, cy: number, r: number, start: number, angle: number) => {
              if (angle >= 359.9) return `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`;
              const s = polar(cx, cy, r, start);
              const e = polar(cx, cy, r, start + angle);
              const large = angle > 180 ? 1 : 0;
              return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
            };
            const missing = pieData.filter((d) => d.value === 0);
            return (
              <>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
                  <svg viewBox="0 0 32 32" className="size-40 shrink-0">
                    {slices.map((s) =>
                      s.value > 0 ? <path key={s.id} d={describe(16, 16, 14, s.start, s.angle)} fill={s.color} stroke="#fff" strokeWidth={0.3} /> : null,
                    )}
                    <circle cx={16} cy={16} r={6.5} fill="#fff" />
                  </svg>
                  <div className="flex-1 space-y-2">
                    {pieData.map((d) => (
                      <div key={d.id} className="flex items-center gap-2.5">
                        <span className="size-3 shrink-0 border border-ink/10" style={{ background: d.color }} />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{d.name}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{d.value ? `${Math.round(d.value)}%` : "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {missing.length > 0 && (
                  <div className="mt-4 grid gap-1 border-t border-ink/5 pt-3" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0,1fr))` }}>
                    {selected.map((s) => {
                      const miss = missing.some((m) => m.id === s.id);
                      return (
                        <p key={s.id} className="text-[10px] leading-tight text-ink/45">
                          {miss ? `${s.name} tidak punya data Design Arena` : ""}
                        </p>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
