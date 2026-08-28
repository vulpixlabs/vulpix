"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLinesIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ImageIcon,
  InfoIcon,
  PlusIcon,
  TypeIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModelPicker, PickerTrigger, type ModelOption } from "@/components/arena/model-picker";
import { ProviderSelect } from "@/components/arena/provider-select";
import { SectionTable, CheckMark, Dash } from "@/components/arena/section-table";
import { BenchmarkCharts, type AAScore } from "@/components/arena/benchmark-charts";
import { DesignArena } from "@/components/arena/design-arena";
import { ActivityChart } from "@/components/arena/activity-chart";
import { openRouterModelLogo } from "@/lib/brand-logos";
import { formatPricePerM, formatTokensCompact, matchKey, trimDec } from "@/lib/arena-format";
import type { ArenaBenchmarks, CombinedModel } from "@/lib/sync";

type SpecMap = Record<string, CombinedModel>;
type ProvidersMap = Record<
  string,
  { providers: string[]; weighted: number | null; quantization: string | null }
>;
type ActivityMap = Record<string, { date: string; tokens: number }[]>;

const MODALITY_ICONS: [string, typeof TypeIcon][] = [
  ["text", TypeIcon],
  ["image", ImageIcon],
  ["audio", AudioLinesIcon],
  ["video", VideoIcon],
  ["file", FileTextIcon],
];

function ModalityIcons({ mods }: { mods: string[] }) {
  return (
    <span className="flex items-center gap-1.5">
      {MODALITY_ICONS.map(([key, Icon]) => (
        <Icon
          key={key}
          className={`size-3.5 ${mods.includes(key) ? "text-exotic" : "text-ink/25"}`}
        />
      ))}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/5 ${className ?? ""}`} />;
}

export default function ArenaPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ModelOption[]>([]);
  const [specs, setSpecs] = useState<SpecMap>({});
  const [bench, setBench] = useState<ArenaBenchmarks | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const [highlight, setHighlight] = useState(true);
  const [providers, setProviders] = useState<ProvidersMap>({});
  const [providerChoice, setProviderChoice] = useState<Record<number, string>>({});
  const [activity, setActivity] = useState<ActivityMap>({});
  const [perfOpen, setPerfOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const keyRef = useRef("");
  useEffect(() => {
    keyRef.current = keyInput;
  }, [keyInput]);
  const orKeyHeaders = useCallback((): Record<string, string> => {
    const key = keyRef.current;
    return key ? { "x-or-key": key } : {};
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("openrouter_key") : null;
    Promise.resolve(saved).then((key) => {
      if (key) setKeyInput(key);
    });
    fetch("/api/models?limit=500", { signal: AbortSignal.timeout(15_000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !Array.isArray(d.models)) return;
        const models: ModelOption[] = d.models.map(
          (m: { id: string; name: string; or?: { created: number | null } }) => ({
            id: m.id,
            name: m.name || m.id,
            created: m.or?.created ?? null,
          }),
        );
        const specMap: SpecMap = {};
        for (const m of d.models as CombinedModel[]) specMap[m.id] = m;
        setList(models);
        setSpecs(specMap);
      })
      .catch(() => {});
    fetch("/api/arena/benchmarks", { headers: orKeyHeaders(), signal: AbortSignal.timeout(15_000) as unknown as RequestInit["signal"] })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.aa) setBench({ aa: d.aa, da: d.da ?? {}, asOf: d.asOf ?? "" });
      })
      .catch(() => {});
    const ctx = gsap.context(() => {
      gsap.from(".arena-head", { y: 24, autoAlpha: 0, duration: 0.8, ease: "power3.out" });
    }, ref);
    return () => ctx.revert();
  }, [orKeyHeaders]);

  useEffect(() => {
    if (!bench || selected.length > 0 || list.length === 0) return;
    const resolve = (aaSlug: string) => {
      if (specs[aaSlug]) return aaSlug;
      const base = aaSlug.replace(/-\d{8}$/, "").replace(/:.*$/, "");
      const hit = list.find(
        (m) => m.id === base || m.id.startsWith(`${base}-`) || m.id.startsWith(`${base}:`),
      );
      return hit?.id ?? aaSlug;
    };
    const ranked = Object.values(bench.aa)
      .filter((m) => m.intelligence != null)
      .sort((a, b) => (b.intelligence ?? 0) - (a.intelligence ?? 0))
      .slice(0, 3)
      .map((m) => resolve(m.slug));
    const fallback = ["openai/gpt-5.5", "anthropic/claude-opus-5", "google/gemini-3.1-pro"].filter(
      (id) => specs[id],
    );
    const next =
      ranked.length >= 3
        ? ranked
        : fallback.length >= 3
          ? fallback
          : list.slice(0, 3).map((m) => m.id);
    queueMicrotask(() => setSelected(next));
  }, [bench, selected.length, list, specs]);

  const selKey = selected.join(",");
  useEffect(() => {
    if (!selKey) return;
    fetch(`/api/arena/activity?slugs=${selKey}`, { headers: orKeyHeaders(), signal: AbortSignal.timeout(12_000) } as RequestInit)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setActivity(d.series ?? {}); })
      .catch(() => {});
    for (const slug of selKey.split(",")) {
      if (providers[slug]) continue;
      fetch(`/api/arena/providers?slug=${encodeURIComponent(slug)}`, { headers: orKeyHeaders(), signal: AbortSignal.timeout(10_000) } as RequestInit)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setProviders((prev) => ({
            ...prev,
            [slug]: {
              providers: (d.providers ?? []).map((p: { name: string }) => p.name),
              weighted: d.weightedInputPerToken ?? null,
              quantization: d.providers?.[0]?.quantization ?? null,
            },
          }));
        })
        .catch(() => {});
    }
  }, [selKey, orKeyHeaders, providers]);

  const ready = selected.length > 0;
  useEffect(() => {
    if (!ready || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".arena-col", {
        y: 28,
        autoAlpha: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power3.out",
      });
      gsap.utils.toArray<HTMLElement>(".arena-section").forEach((el) => {
        gsap.from(el, {
          y: 24,
          autoAlpha: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [ready, selected.length]);

  const selModels = useMemo(
    () =>
      selected.map((id) => ({
        id,
        name:
          specs[id]?.name ??
          matchKey(bench?.aa ?? {}, id)?.displayName ??
          id,
      })),
    [selected, specs, bench],
  );
  const columns = Math.max(selected.length, 1);
  const gridStyle = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };

  const authorOf = (id: string) => {
    const author = id.split("/")[0] ?? "";
    return author.charAt(0).toUpperCase() + author.slice(1);
  };

  const addModel = () => {
    if (selected.length >= 4) return;
    const next = list.find((m) => !selected.includes(m.id));
    if (next) setSelected([...selected, next.id]);
  };

  const removeModel = (idx: number) => {
    if (selected.length <= 2) return;
    setSelected(selected.filter((_, i) => i !== idx));
  };

  const swapModel = (idx: number, id: string) => {
    setSelected(selected.map((s, i) => (i === idx ? id : s)));
  };

  const saveKey = () => {
    if (typeof window !== "undefined") localStorage.setItem("openrouter_key", keyInput);
    keyRef.current = keyInput;
    setBench(null);
    fetch("/api/arena/benchmarks", { headers: orKeyHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.aa) setBench({ aa: d.aa, da: d.da ?? {}, asOf: d.asOf ?? "" });
      })
      .catch(() => {});
  };

  const pricingRows = [
    {
      label: "Input",
      tip: undefined,
      cell: (id: string) => formatPricePerM(specs[id]?.or?.pricing.prompt ?? null),
    },
    { label: "Output", cell: (id: string) => formatPricePerM(specs[id]?.or?.pricing.completion ?? null) },
    { label: "Cached input", cell: (id: string) => formatPricePerM(specs[id]?.or?.pricing.inputCacheRead ?? null) },
    {
      label: "Weighted Average Input",
      tip: "Rata-rata harga input dari semua provider yang tersedia",
      cell: (id: string) => {
        const w = providers[id]?.weighted;
        return w != null ? `$${trimDec(w * 1_000_000)} / M tokens` : <Dash />;
      },
    },
    { label: "Cache Write", cell: (id: string) => formatPricePerM(specs[id]?.or?.pricing.inputCacheWrite ?? null) },
    { label: "Cache Write (1h)", cell: () => <Dash /> },
    { label: "Image Input", cell: (id: string) => formatPricePerM(specs[id]?.or?.pricing.image ?? null) },
    { label: "Input Audio", cell: () => <Dash /> },
    { label: "Input Audio Cache", cell: () => <Dash /> },
    {
      label: "Web Search",
      cell: (id: string) => {
        const w = specs[id]?.or?.pricing.webSearch;
        return w != null ? `$${trimDec(w * 1000)} /1K calls` : <Dash />;
      },
    },
  ];

  const featureRows = [
    {
      label: "Quantization",
      cell: (id: string) => (
        <Badge variant="outline" className="rounded-none border-ink/15 text-xs font-normal text-ink/70">
          {providers[id]?.quantization ?? "unknown"}
        </Badge>
      ),
    },
    {
      label: "Max output tokens",
      cell: (id: string) =>
        specs[id]?.or?.maxCompletionTokens != null ? (
          formatTokensCompact(specs[id]?.or?.maxCompletionTokens ?? 0)
        ) : (
          <Dash />
        ),
    },
    { label: "Reasoning", cell: (id: string) => <CheckMark on={specs[id]?.or?.supportedParameters.includes("include_reasoning") ?? false} /> },
    { label: "Tool use", cell: (id: string) => <CheckMark on={specs[id]?.or?.supportedParameters.includes("tools") ?? false} /> },
    {
      label: "Structured outputs",
      cell: (id: string) => (
        <CheckMark
          on={
            specs[id]?.or?.supportedParameters.includes("structured_outputs") ||
            specs[id]?.or?.supportedParameters.includes("response_format") ||
            false
          }
        />
      ),
    },
    {
      label: "Caching",
      cell: (id: string) => <CheckMark on={specs[id]?.or?.pricing.inputCacheRead != null} />,
    },
  ];

  return (
    <div ref={ref} className="min-h-dvh overflow-x-clip bg-paper text-ink">
      <TooltipProvider>
      <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="arena-head flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
              {ready ? (
                selModels.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && <span className="font-normal text-ink"> vs </span>}
                    {m.name}
                  </span>
                ))
              ) : (
                <Skeleton className="h-9 w-96" />
              )}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-ink/55">
              Compare models on intelligence, coding, agentic benchmarks, pricing and activity.
              Live data from the OpenRouter benchmarks API, updated hourly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <Switch checked={highlight} onCheckedChange={setHighlight} aria-label="Highlight best" />
              Highlight best
            </label>
            <button
              type="button"
              onClick={addModel}
              disabled={selected.length >= 4}
              className="flex items-center gap-1.5 border-2 border-ink bg-paper px-3.5 py-1.5 text-sm font-semibold text-ink shadow-[3px_3px_0_0_#000] transition-all hover:-translate-y-0.5 hover:border-exotic hover:text-exotic disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <PlusIcon className="size-4" /> Add model
            </button>
            <Link
              href="/playground"
              className="flex items-center gap-1.5 border-2 border-exotic bg-exotic px-3.5 py-1.5 text-sm font-semibold text-paper shadow-[3px_3px_0_0_#000] transition-all hover:-translate-y-0.5"
            >
              Chat
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="OpenRouter API key (opsional, dipakai otomatis kalau limit)"
            className="h-8 min-w-0 flex-1 border border-ink/15 bg-paper px-3 text-xs text-ink outline-none placeholder:text-ink/35 focus:border-exotic"
          />
          <button
            type="button"
            onClick={saveKey}
            className="h-8 shrink-0 border border-ink/15 px-3 text-xs font-semibold text-ink hover:border-exotic hover:text-exotic"
          >
            Save
          </button>
        </div>

        <div className="sticky top-[64px] z-30 -mx-2 bg-paper px-2 py-3">
            <div className="grid gap-3" style={gridStyle}>
              {selected.map((id, idx) => (
                <div key={`${id}-${idx}`} className="arena-col relative min-w-0">
                  <div className="flex items-center gap-1 border-2 border-ink bg-paper px-3 py-2">
                    <PickerTrigger
                      icon={openRouterModelLogo(id)}
                      name={specs[id]?.name ?? matchKey(bench?.aa ?? {}, id)?.displayName ?? id}
                      onClick={() => setPickerIdx(pickerIdx === idx ? null : idx)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Info model" className="shrink-0 p-1 text-ink/40 hover:text-ink">
                          <InfoIcon className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-none border-2 border-ink text-xs">{id}</TooltipContent>
                    </Tooltip>
                    <a
                      href={`https://openrouter.ai/${id}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Buka di OpenRouter"
                      className="shrink-0 p-1 text-ink/40 hover:text-ink"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeModel(idx)}
                      disabled={selected.length <= 2}
                      aria-label="Hapus kolom"
                      className="shrink-0 p-1 text-ink/40 hover:text-exotic disabled:opacity-30"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <ProviderSelect
                      providers={providers[id]?.providers ?? []}
                      value={providerChoice[idx] ?? "Auto"}
                      onChange={(v) => setProviderChoice((prev) => ({ ...prev, [idx]: v }))}
                    />
                  </div>
                  <ModelPicker
                    models={list}
                    selectedId={id}
                    onSelect={(nextId) => swapModel(idx, nextId)}
                    open={pickerIdx === idx}
                    onOpenChange={(o) => setPickerIdx(o ? idx : null)}
                  />
                </div>
              ))}
              {selected.length === 0 && <Skeleton className="col-span-full h-20" />}
            </div>
          </div>

        {ready && (
          <>
            <SectionTable
              title="Overview"
              columns={columns}
              className="mt-6"
              rows={[
                {
                  label: "Author",
                  cells: selected.map((id: string) => (
                    <a
                      key={id}
                      href={`https://openrouter.ai/${id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-exotic"
                    >
                      {authorOf(id)}
                    </a>
                  )),
                },
                {
                  label: "Context length",
                  cells: selected.map((id: string) =>
                    specs[id]?.or?.contextLength != null ? (
                      `${formatTokensCompact(specs[id]?.or?.contextLength ?? 0)} tokens`
                    ) : (
                      <Dash key={id} />
                    ),
                  ),
                },
                {
                  label: "Reasoning",
                  cells: selected.map((id: string) => (
                    <CheckMark key={id} on={specs[id]?.or?.supportedParameters.includes("reasoning") ?? false} />
                  )),
                },
                {
                  label: "Input modalities",
                  cells: selected.map((id: string) => (
                    <ModalityIcons key={id} mods={specs[id]?.or?.architecture?.inputModalities ?? []} />
                  )),
                },
                {
                  label: "Output modalities",
                  cells: selected.map((id: string) => (
                    <ModalityIcons key={id} mods={specs[id]?.or?.architecture?.outputModalities ?? []} />
                  )),
                },
                {
                  label: "Providers",
                  cells: selected.map((id: string) =>
                    providers[id] ? (
                      <a
                        key={id}
                        href={`https://openrouter.ai/${id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-exotic"
                      >
                        {providers[id].providers.length} providers
                      </a>
                    ) : (
                      <Dash key={id} />
                    ),
                  ),
                },
              ]}
            />

            <SectionTable
              title="Pricing"
              columns={columns}
              className="mt-10"
              rows={pricingRows.map((row) => ({
                label: row.label,
                tip: row.tip,
                cells: selected.map((id) => row.cell(id)),
              }))}
            />

            <SectionTable
              title="Performance"
              columns={columns}
              className="mt-10"
              rows={[
                {
                  label: "Latency (p50)",
                  tip: "Waktu tunggu rata-rata hingga model mulai menjawab, dari Design Arena",
                  cells: selected.map((id) => {
                    const daHit = Object.values(matchKey(bench?.da ?? {}, id) ?? {})[0];
                    return daHit?.avgGenMs != null ? (
                      `${(daHit.avgGenMs / 1000).toFixed(2)} s`
                    ) : (
                      <Dash key={id} />
                    );
                  }),
                },
                { label: "Throughput (p50)", cells: selected.map((id) => <Dash key={id} />) },
                {
                  label: "Visualize Performance",
                  cells: selected.map((id) => {
                    const daHit = Object.values(matchKey(bench?.da ?? {}, id) ?? {})[0];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPerfOpen((v) => !v)}
                        className="flex items-center gap-1 text-ink/60 hover:text-ink"
                        aria-expanded={perfOpen}
                      >
                        {perfOpen && daHit?.avgGenMs != null
                          ? `avg gen ${(daHit.avgGenMs / 1000).toFixed(1)} s`
                          : perfOpen
                            ? "-"
                            : ""}
                        <ChevronDownIcon
                          className={`size-4 transition-transform ${perfOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    );
                  }),
                },
              ]}
            />

            <SectionTable
              title="Features"
              columns={columns}
              className="mt-10"
              rows={featureRows.map((row) => ({
                label: row.label,
                cells: selected.map((id) => row.cell(id)),
              }))}
            />

            <section className="arena-section mt-10">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Benchmarks</h2>
              <h3 className="mt-5 text-sm font-semibold text-ink">Artificial Analysis</h3>
              {bench ? (
                <BenchmarkCharts aa={bench.aa as Record<string, AAScore>} selected={selModels} />
              ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <Skeleton className="h-56" />
                  <Skeleton className="h-56" />
                  <Skeleton className="h-56" />
                </div>
              )}
              <DesignArena da={bench?.da ?? {}} selected={selModels} columns={columns} />
            </section>

            <section className="arena-section mt-10 pb-16">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Activity</h2>
              <div className="mt-4 overflow-x-auto">
                <div className="grid min-w-[640px] gap-6" style={gridStyle}>
                  {selected.map((id) => (
                    <ActivityChart
                      key={id}
                      name={specs[id]?.name ?? matchKey(bench?.aa ?? {}, id)?.displayName ?? id}
                      series={activity[id]}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-[11px] text-ink/40">
                Source: OpenRouter (openrouter.ai/rankings), daily public usage dataset.
              </p>
            </section>
          </>
        )}
      </div>
      </TooltipProvider>
    </div>
  );
}
