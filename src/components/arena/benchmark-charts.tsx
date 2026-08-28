"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { openRouterModelLogo } from "@/lib/brand-logos";
import { matchKey, permaBase } from "@/lib/arena-format";
import { LogoMark } from "@/components/ui/logo-mark";

export interface AAScore {
  slug: string;
  displayName: string;
  intelligence: number | null;
  coding: number | null;
  agentic: number | null;
}

interface BenchmarkChartsProps {
  aa: Record<string, AAScore>;
  selected: { id: string; name: string }[];
}

const HIGHLIGHTS = ["#F54F1B", "#FF8C4A", "#FFB37F", "#FFD1AD"];
const METRICS = [
  { key: "intelligence" as const, title: "Intelligence" },
  { key: "coding" as const, title: "Coding" },
  { key: "agentic" as const, title: "Agentic" },
];

export function BenchmarkCharts({ aa, selected }: BenchmarkChartsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".aa-bar-fill").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.8,
            ease: "power3.out",
            transformOrigin: "bottom",
            scrollTrigger: { trigger: el.closest(".arena-chart"), start: "top 88%" },
          },
        );
      });
    }, ref);
    return () => ctx.revert();
  }, [aa, selected]);

  const shortName = (name: string) => (name.length > 16 ? `${name.slice(0, 15)}…` : name);

  return (
    <div ref={ref} className="mt-4 grid gap-4 lg:grid-cols-3">
      {METRICS.map((metric) => {
        const entries = Object.values(aa)
          .filter((m) => m[metric.key] != null)
          .map((m) => ({ slug: m.slug, name: m.displayName, value: m[metric.key] as number }));
        for (const sel of selected) {
          const hit = matchKey(aa, sel.id);
          if (hit?.[metric.key] != null && !entries.some((e) => e.slug === hit.slug)) {
            entries.push({ slug: hit.slug, name: hit.displayName, value: hit[metric.key] as number });
          }
        }
        entries.sort((a, b) => b.value - a.value);
        const bars = entries.slice(0, 10);
        const selectedValues = selected
          .map((s) => matchKey(aa, s.id)?.[metric.key] as number | null)
          .filter((v): v is number => v != null);
        const maxSel = selectedValues.length ? Math.max(...selectedValues) : Math.max(...bars.map((b) => b.value), 1);
        const missing = selected.filter((s) => matchKey(aa, s.id)?.[metric.key] == null);

        return (
          <div key={metric.key} className="arena-chart border border-ink/10 bg-paper p-4">
            <p className="text-sm font-semibold text-ink">{metric.title}</p>
            <div className="relative mt-4 h-40">
              {[100, 75, 50, 25, 0].map((tickPct) => {
                const tickVal = Math.round((maxSel * tickPct) / 100);
                return (
                  <div
                    key={tickPct}
                    className="absolute inset-x-0 border-t border-ink/8"
                    style={{ bottom: `${tickPct}%` }}
                  >
                    <span className="absolute -top-2 -left-1 -translate-x-full text-[10px] tabular-nums text-ink/40">
                      {tickVal}
                    </span>
                  </div>
                );
              })}
              <div className="absolute inset-0 flex items-end gap-1.5 pl-8">
                {bars.map((bar) => {
                  const selIdx = selected.findIndex((s) => {
                    const base = permaBase(s.id);
                    return bar.slug === s.id || bar.slug === base || bar.slug.startsWith(`${base}-`) || bar.slug.startsWith(`${s.id}-`) || bar.slug.startsWith(`${s.id}:`);
                  });
                  const isHi = selIdx !== -1;
                  const h = Math.min((bar.value / maxSel) * 88 + 4, 98);
                  return (
                    <div key={bar.slug} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[10px] font-semibold tabular-nums text-ink">{Math.round(bar.value)}</span>
                      <div
                        className="aa-bar-fill w-full"
                        style={{
                          height: `${Math.max(h, 4)}%`,
                          background: isHi ? HIGHLIGHTS[selIdx % HIGHLIGHTS.length] : "#ffffff",
                          border: isHi ? "none" : "1px solid rgba(0,0,0,0.15)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex h-14 items-start gap-1.5 pl-8">
              {bars.map((bar) => {
                const isHi = selected.some((s) => {
                  const base = permaBase(s.id);
                  return bar.slug === s.id || bar.slug === base || bar.slug.startsWith(`${base}-`) || bar.slug.startsWith(`${s.id}-`) || bar.slug.startsWith(`${s.id}:`);
                });
                return (
                  <div key={bar.slug} className="flex min-w-0 flex-1 justify-end overflow-visible pr-0.5">
                    <span
                      className="flex origin-top-right items-center gap-1 whitespace-nowrap text-[9px] leading-none"
                      style={{ transform: "rotate(-38deg)" }}
                    >
                      <LogoMark
                        name={bar.slug.split("/")[0] ?? bar.name}
                        src={openRouterModelLogo(bar.slug)}
                        className="size-2.5 text-[5px]"
                        fallbackClassName="border border-ink/10 bg-paper text-ink"
                      />
                      <span className={isHi ? "font-semibold text-ink" : "text-ink/50"}>{shortName(bar.name)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            {missing.length > 0 && (
              <div className="mt-3 grid gap-1 border-t border-ink/5 pt-2" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0,1fr))` }}>
                {selected.map((s) => {
                  const miss = missing.some((m) => m.id === s.id);
                  return (
                    <p key={s.id} className="text-[10px] leading-tight text-ink/45">
                      {miss ? `${s.name} tidak punya data ${metric.title.toLowerCase()}` : ""}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
