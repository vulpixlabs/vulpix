"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { dayLabel, formatCompactEn } from "@/lib/arena-format";

interface ActivityChartProps {
  name: string;
  series: { date: string; tokens: number }[] | undefined;
}

export function ActivityChart({ name, series }: ActivityChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rows = series ?? [];

  useEffect(() => {
    if (!ref.current || !rows.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.querySelectorAll(".act-bar"),
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "bottom",
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.015,
          scrollTrigger: { trigger: ref.current, start: "top 88%" },
        },
      );
    }, ref);
    return () => ctx.revert();
  }, [rows.length]);

  const total = rows.reduce((a, b) => a + b.tokens, 0);
  const max = Math.max(...rows.map((r) => r.tokens), 1);
  const ticks = rows.length
    ? [0, Math.floor(rows.length / 2), rows.length - 1].filter(
        (i, idx, arr) => arr.indexOf(i) === idx,
      )
    : [];

  return (
    <div ref={ref} className="arena-activity">
      <p className="flex items-baseline gap-2">
        <span className="text-lg font-bold tabular-nums text-ink">
          {total ? formatCompactEn(total) : "-"}
        </span>
        <span className="text-xs text-ink/50">tokens · last 30 days</span>
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 flex h-32 items-center justify-center border border-ink/10 text-sm text-ink/40">
          {series === undefined ? "Loading activity..." : "No public activity data for this model."}
        </p>
      ) : (
        <>
          <div className="relative mt-3 h-32 border-b border-l border-ink/10 pl-1 pt-1">
            <span className="absolute -top-1 left-0 text-[10px] tabular-nums text-ink/40">
              {formatCompactEn(max)}
            </span>
            <div className="flex h-full items-end gap-[2px]">
              {rows.map((r) => (
                <div
                  key={r.date}
                  className="act-bar min-w-0 flex-1 bg-exotic"
                  style={{ height: `${Math.max((r.tokens / max) * 100, 2)}%` }}
                  title={`${r.date}: ${formatCompactEn(r.tokens)}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-ink/45">
            {ticks.map((i) => (
              <span key={rows[i].date}>{dayLabel(rows[i].date)}</span>
            ))}
          </div>
        </>
      )}
      <p className="sr-only">{name} activity</p>
    </div>
  );
}
