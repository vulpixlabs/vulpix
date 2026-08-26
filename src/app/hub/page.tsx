"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { gsap } from "@/lib/gsap";
import type { HFModel } from "@/lib/hf";
import { LANGUAGES } from "@/lib/hf";
import { ModelsAdvancedSearch } from "@/components/hub/advanced-search";
import { ModelCard } from "@/components/hub/model-card";
import { DatasetHub } from "@/components/hub/dataset-hub";
import { SearchCommand } from "@/components/hub/search-command";
import { HubSwitch, type HubView } from "@/components/hub/hub-switch";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { GridCard } from "@/components/ui/grid-card";
import { Avatar } from "@/components/hub/model-card";
import { formatNum, timeAgo } from "@/lib/hf";
import Link from "next/link";
import { DatabaseIcon, DownloadIcon, HeartIcon } from "lucide-react";

const TASKS: [string, string][] = [
  ["text-generation", "Text Generation"],
  ["text-to-image", "Text-to-Image"],
  ["image-text-to-text", "Image-Text-to-Text"],
  ["automatic-speech-recognition", "Speech-to-Text"],
  ["text-to-speech", "Text-to-Speech"],
  ["feature-extraction", "Embeddings"],
  ["image-classification", "Image Classification"],
  ["text-to-video", "Text-to-Video"],
  ["any-to-any", "Any-to-Any"],
];

const LIBS = [
  "transformers",
  "diffusers",
  "sentence-transformers",
  "gguf",
  "peft",
  "timm",
];

const LICENSES: [string, string][] = [
  ["apache-2.0", "apache-2.0"],
  ["mit", "mit"],
  ["openrail", "openrail"],
  ["llama3.2", "llama3.2"],
  ["cc-by-4.0", "cc-by-4.0"],
  ["gemma", "gemma"],
  ["gpl-3.0", "gpl-3.0"],
  ["bsd-3-clause", "bsd-3-clause"],
  ["wtfpl", "wtfpl"],
  ["agpl-3.0", "agpl-3.0"],
];

const SORTS: [string, string][] = [
  ["trendingScore", "Trending"],
  ["downloads", "Most Downloads"],
  ["likes", "Most Likes"],
  ["lastModified", "Recently Updated"],
];

const LIMIT = 30;
const MIN_VISIBLE = 30;
const MAX_PAGES = 6;
const PMAX_OPEN = 100;

function fmtB(b: number) {
  if (b >= PMAX_OPEN) return "100B+";
  if (b < 1) return "<1B";
  return `${b}B`;
}

function FeaturedModel({ m }: { m: HFModel }) {
  const parts = m.id.split("/");
  const author = parts.length > 1 ? parts[0] : "";
  const name = parts.length > 1 ? parts.slice(1).join("/") : m.id;
  return (
    <Link href={`/hub/model/${encodeURIComponent(m.id)}`} className="block sm:col-span-2">
      <GridCard className="min-h-[240px] p-7">
        <div className="flex items-start justify-between">
          <Avatar author={author || undefined} id={m.id} className="size-12" />
          <span className="label flex items-center gap-2 text-ink/40 group-hover:text-paper/60">
            <DatabaseIcon className="size-4" /> Featured model
          </span>
        </div>
        <div className="mt-8">
          <h3 className="font-serif text-3xl leading-tight text-ink group-hover:text-paper">
            {author && <span className="text-ink/50 group-hover:text-paper/70">{author}/</span>}
            {name}
          </h3>
          <p className="mt-2 flex flex-wrap gap-2 text-xs">
            {m.pipeline_tag && <span className="border border-ink/15 px-2 py-0.5 group-hover:border-paper/30 group-hover:text-paper/80">{m.pipeline_tag}</span>}
            {m.library_name && <span className="border border-ink/15 px-2 py-0.5 group-hover:border-paper/30 group-hover:text-paper/80">{m.library_name}</span>}
            {m.safetensors?.total ? <span className="border border-ink/15 px-2 py-0.5 group-hover:border-paper/30 group-hover:text-paper/80">{formatNum(m.safetensors.total)} params</span> : null}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-5 text-xs text-ink/60 group-hover:text-paper/80">
          <span className="flex items-center gap-1.5"><DownloadIcon className="size-3.5" /> {formatNum(m.downloads)}</span>
          <span className="flex items-center gap-1.5"><HeartIcon className="size-3.5" /> {formatNum(m.likes)}</span>
          <span className="ml-auto">Updated {timeAgo(m.lastModified)}</span>
        </div>
      </GridCard>
    </Link>
  );
}

function ModelsPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const [models, setModels] = useState<HFModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const task = sp.get("task") ?? "";
  const lib = sp.get("lib") ?? "";
  const license = sp.get("license") ?? "";
  const lang = sp.get("lang") ?? "";
  const baseOnly = sp.get("baseonly") === "1";
  const sort = sp.get("sort") ?? "trendingScore";

  const pmaxRaw = sp.get("pmax");
  const pmax = pmaxRaw ? Number(pmaxRaw) : PMAX_OPEN;
  const [pmaxVal, setPmaxVal] = useState<number>(pmax);
  const pmaxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawRef = useRef<HFModel[]>([]);

  useEffect(() => {
    queueMicrotask(() => setPmaxVal(pmax));
  }, [pmax]);

  useEffect(() => {
    const pmin = sp.get("pmin");
    if (pmin !== null) {
      const next = new URLSearchParams(sp.toString());
      next.delete("pmin");
      router.replace(`/hub?${next.toString()}`);
    }
  }, [sp, router]);

  const filterByParams = useCallback(
    (list: HFModel[]) => {
      let out = list;
      if (baseOnly) {
        out = out.filter(
          (m) => !(m.tags ?? []).some((t) => t.startsWith("base_model:"))
        );
      }
      if (pmaxRaw === null) return out;
      const hi = Number(pmaxRaw);
      return out.filter((m) => {
        const b = (m.safetensors?.total ?? 0) / 1e9;
        if (b === 0) return true;
        return b <= hi;
      });
    },
    [baseOnly, pmaxRaw]
  );

  const fetchPage = useCallback(
    async (skip: number): Promise<HFModel[]> => {
      const u = new URLSearchParams();
      if (sp.get("q")) u.set("q", sp.get("q")!);
      if (task) u.set("task", task);
      if (lib) u.set("lib", lib);
      if (license) u.set("license", license);
      if (lang) u.set("lang", lang);
      if (sort) u.set("sort", sort);
      u.set("limit", String(LIMIT));
      if (skip) u.set("skip", String(skip));
      const res = await fetch(`/api/hf/models?${u.toString()}`, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    [sp, task, lib, license, lang, sort]
  );

  useEffect(() => {
    let alive = true;
    rawRef.current = [];
    queueMicrotask(() => {
      setLoading(true);
      setDone(false);
      setModels([]);
    });
    (async () => {
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await fetchPage(rawRef.current.length).catch(() => []);
        if (!alive) return;
        rawRef.current = rawRef.current.concat(batch);
        const out = filterByParams(rawRef.current);
        setModels(out);
        if (batch.length < LIMIT) {
          setDone(true);
          setLoading(false);
          return;
        }
        if (out.length >= MIN_VISIBLE) {
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [fetchPage, filterByParams]);

  const loadMore = async () => {
    setLoading(true);
    const target = models.length + MIN_VISIBLE;
    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await fetchPage(rawRef.current.length).catch(() => []);
      rawRef.current = rawRef.current.concat(batch);
      const out = filterByParams(rawRef.current);
      setModels(out);
      if (batch.length < LIMIT) {
        setDone(true);
        break;
      }
      if (out.length >= target) break;
    }
    setLoading(false);
  };

  const setParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete("skip");
      router.push(`/hub?${next.toString()}`);
    },
    [router, sp]
  );

  const onSlide = ([v]: number[]) => {
    setPmaxVal(v);
    if (pmaxTimer.current) clearTimeout(pmaxTimer.current);
    pmaxTimer.current = setTimeout(() => {
      setParams({ pmax: v < PMAX_OPEN ? String(v) : "" });
    }, 300);
  };

  const pill = (active: boolean) =>
    `cursor-pointer border px-3 py-1.5 text-left text-sm transition-none ${
      active
        ? "border-exotic bg-exotic text-paper"
        : "border-ink/15 text-ink hover:border-exotic hover:text-exotic"
    }`;

  return (
    <div className="grid min-w-0 gap-10 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-8">
        <div>
          <p className="label mb-3 text-ink/50">Tasks</p>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
            <button className={pill(!task)} onClick={() => setParams({ task: "" })}>
              All tasks
            </button>
            {TASKS.map(([v, l]) => (
              <button key={v} className={pill(task === v)} onClick={() => setParams({ task: v })}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3 text-ink/50">Libraries</p>
          <div className="flex flex-wrap gap-2">
            {LIBS.map((v) => (
              <button key={v} className={pill(lib === v)} onClick={() => setParams({ lib: lib === v ? "" : v })}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3 text-ink/50">Licenses</p>
          <div className="flex flex-wrap gap-2">
            {LICENSES.map(([v, l]) => (
              <button
                key={v}
                className={pill(license === v)}
                onClick={() => setParams({ license: license === v ? "" : v })}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3 text-ink/50">Languages</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(([v, l]) => (
              <button key={v} className={pill(lang === v)} onClick={() => setParams({ lang: lang === v ? "" : v })}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3 text-ink/50">Params, max size</p>
          <div className="border border-ink/10 p-4">
            <div className="mb-4 flex items-center justify-between font-mono text-sm font-semibold">
              <span className="text-ink/40">≤</span>
              <span>{fmtB(pmaxVal)}</span>
              <span className="text-xs font-normal text-ink/40">{pmaxVal >= PMAX_OPEN ? "All sizes" : "and smaller"}</span>
            </div>
            <Slider
              value={[pmaxVal]}
              min={0}
              max={PMAX_OPEN}
              step={1}
              onValueChange={onSlide}
              aria-label="Max parameter count"
              className="[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:rounded-none [&_[data-slot=slider-track]]:bg-ink/15 [&_[data-slot=slider-range]]:bg-exotic [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rounded-none [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-paper hover:[&_[data-slot=slider-thumb]]:border-exotic"
            />
            <p className="mt-3 text-xs text-ink/40">≤ {fmtB(pmaxVal)} · unknown size always shown</p>
          </div>
        </div>
        <ModelsAdvancedSearch task={task} setParams={setParams} />
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/60">
            {loading ? "Loading…" : `${models.length}${done ? "" : "+"} models`}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <Switch
                checked={baseOnly}
                onCheckedChange={(v) => setParams({ baseonly: v ? "1" : "" })}
                aria-label="Base models only"
                className="data-[state=checked]:bg-exotic data-[state=unchecked]:bg-ink/20"
              />
              <span className="text-sm font-semibold text-ink">Base only</span>
            </label>
            <div className="relative flex items-center gap-2">
              <span className="label text-ink/50">Sort</span>
              <select
                value={sort}
                onChange={(e) => setParams({ sort: e.target.value })}
                className="cursor-pointer appearance-none border-2 border-ink bg-paper py-1.5 pl-3 pr-9 text-sm font-semibold text-ink outline-none transition-none hover:border-exotic focus:border-exotic"
              >
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 size-4 text-exotic" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {models.length > 0 && <FeaturedModel m={models[0]} />}
          {models.slice(1).map((m) => (
            <ModelCard key={m.id} m={m} />
          ))}
        </div>

        {!loading && models.length === 0 && (
          <p className="py-20 text-center text-ink/50">
            No models found for this filter.
          </p>
        )}

        {!done && !loading && models.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="border-2 border-ink px-8 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] transition-none hover:bg-exotic hover:text-paper"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HubShell() {
  const router = useRouter();
  const sp = useSearchParams();
  const view: HubView = sp.get("view") === "datasets" ? "datasets" : "models";
  const contentRef = useRef<HTMLDivElement>(null);
  const prevView = useRef<HubView>(view);

  useEffect(() => {
    if (window.self !== window.top) {
      document.documentElement.style.overscrollBehavior = "contain";
    }
  }, []);

  useEffect(() => {
    if (prevView.current === view) return;
    prevView.current = view;
    if (!contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }
    );
  }, [view]);

  const switchView = (v: HubView) => {
    if (v === view) return;
    const el = contentRef.current;
    if (el) {
      gsap.to(el, {
        autoAlpha: 0,
        y: -16,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => router.push(`/hub?view=${v}`),
      });
    } else {
      router.push(`/hub?view=${v}`);
    }
  };

  return (
    <div
      data-trail="light"
      className="mx-auto w-full max-w-[1200px] overflow-hidden px-6 py-14 md:px-10"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <h1 className="font-serif text-5xl">
            {view === "datasets" ? "Datasets" : "Models"}{" "}
            <span className="text-exotic">.</span>
          </h1>
          <HubSwitch view={view} onChange={switchView} />
        </div>
        <SearchCommand
          key={`hub-search-${view}-${sp.get("q") ?? ""}`}
          variant="hub"
          initialQuery={sp.get("q") ?? ""}
          placeholder={view === "datasets" ? "Filter datasets by name…" : "Filter by name…"}
          onSubmit={(v) => {
            const next = new URLSearchParams(sp.toString());
            if (v) next.set("q", v);
            else next.delete("q");
            next.delete("skip");
            router.push(`/hub?${next.toString()}`);
          }}
        />
      </div>

      <div ref={contentRef} className="mt-10">
        {view === "datasets" ? <DatasetHub /> : <ModelsPanel />}
      </div>
    </div>
  );
}

export default function HubPage() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-ink/50">Loading hub…</div>}>
      <HubShell />
    </Suspense>
  );
}
