"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon, DatabaseIcon, DownloadIcon, HeartIcon } from "lucide-react";
import type { HFDataset } from "@/lib/hf";
import {
  DATASET_FORMATS,
  DATASET_MODALITIES,
  DATASET_TASKS,
  SIZE_BUCKETS,
  datasetSize,
  datasetTask,
  formatNum,
  timeAgo,
} from "@/lib/hf";
import { DatasetCard } from "@/components/hub/dataset-card";
import { GridCard } from "@/components/ui/grid-card";
import { Slider } from "@/components/ui/slider";
import { Avatar } from "@/components/hub/model-card";
import { DatasetsAdvancedSearch } from "@/components/hub/advanced-search";

const SORTS: [string, string][] = [
  ["trendingScore", "Trending"],
  ["downloads", "Most Downloads"],
  ["likes", "Most Likes"],
  ["lastModified", "Recently Updated"],
];

const LIMIT = 30;
const MIN_VISIBLE = 30;
const MAX_PAGES = 6;

function FeaturedDataset({ d }: { d: HFDataset }) {
  const parts = d.id.split("/");
  const author = parts.length > 1 ? parts[0] : "";
  const name = parts.length > 1 ? parts.slice(1).join("/") : d.id;
  const task = datasetTask(d.tags);
  const size = datasetSize(d.tags);

  return (
    <Link
      href={`/hub/datasets/${encodeURIComponent(d.id)}`}
      className="block sm:col-span-2"
    >
      <GridCard className="min-h-[240px] p-7">
        <div className="flex items-start justify-between">
          <Avatar author={author || undefined} id={d.id} className="size-12" />
          <span className="label flex items-center gap-2 text-ink/40 group-hover:text-paper/60">
            <DatabaseIcon className="size-4" />
            Featured dataset
          </span>
        </div>
        <div className="mt-8">
          <h3 className="font-serif text-3xl leading-tight text-ink group-hover:text-paper">
            {author && <span className="text-ink/50 group-hover:text-paper/70">{author}/</span>}
            {name}
          </h3>
          <p className="mt-2 text-sm text-ink/60 group-hover:text-paper/80">
            {[task, size ? `${size} rows` : null].filter(Boolean).join(" · ") || "Community dataset"}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-5 text-xs text-ink/60 group-hover:text-paper/80">
          <span className="flex items-center gap-1.5">
            <DownloadIcon className="size-3.5" /> {formatNum(d.downloads)}
          </span>
          <span className="flex items-center gap-1.5">
            <HeartIcon className="size-3.5" /> {formatNum(d.likes)}
          </span>
          <span className="ml-auto">Updated {timeAgo(d.lastModified)}</span>
        </div>
      </GridCard>
    </Link>
  );
}

export function DatasetHub() {
  const router = useRouter();
  const sp = useSearchParams();
  const [datasets, setDatasets] = useState<HFDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const task = sp.get("task") ?? "";
  const modality = sp.get("modality") ?? "";
  const format = sp.get("format") ?? "";
  const smaxRaw = sp.get("smax");
  const sminRaw = sp.get("smin");
  const smax = smaxRaw === null ? SIZE_BUCKETS.length : Number(smaxRaw);
  const sort = sp.get("sort") ?? "trendingScore";
  const rawRef = useRef<HFDataset[]>([]);

  useEffect(() => {
    if (sp.get("smin") !== null) {
      const next = new URLSearchParams(sp.toString());
      next.delete("smin");
      router.replace(`/hub?${next.toString()}`);
    }
  }, [sp, router]);

  const bucketIndex = (d: HFDataset): number => {
    const tag = (d.tags ?? []).find((t) => t.startsWith("size_categories:"))?.replace("size_categories:", "");
    const i = SIZE_BUCKETS.indexOf((tag ?? "") as (typeof SIZE_BUCKETS)[number]);
    return i;
  };

  const filterBySize = useCallback(
    (list: HFDataset[]) => {
      if (smax === SIZE_BUCKETS.length && sminRaw === null) return list;
      return list.filter((d) => {
        const i = bucketIndex(d);
        if (i === -1) return true;
        return i < smax;
      });
    },
    [smax, sminRaw]
  );

  const fetchPage = useCallback(
    async (skip: number): Promise<HFDataset[]> => {
      const u = new URLSearchParams();
      if (sp.get("q")) u.set("q", sp.get("q")!);
      if (task) u.set("task", task);
      if (modality) u.set("modality", modality);
      if (format) u.set("format", format);
      if (sort) u.set("sort", sort);
      u.set("limit", String(LIMIT));
      if (skip) u.set("skip", String(skip));
      const res = await fetch(`/api/hf/datasets?${u.toString()}`, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    [sp, task, modality, format, sort]
  );

  useEffect(() => {
    let alive = true;
    rawRef.current = [];
    queueMicrotask(() => {
      setLoading(true);
      setDone(false);
      setDatasets([]);
    });
    (async () => {
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await fetchPage(rawRef.current.length).catch(() => []);
        if (!alive) return;
        rawRef.current = rawRef.current.concat(batch);
        setDatasets(filterBySize(rawRef.current));
        if (batch.length < LIMIT) {
          setDone(true);
          setLoading(false);
          return;
        }
        if (rawRef.current.length >= MIN_VISIBLE) {
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [fetchPage, filterBySize]);

  const loadMore = async () => {
    setLoading(true);
    const target = datasets.length + MIN_VISIBLE;
    for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await fetchPage(rawRef.current.length).catch(() => []);
      rawRef.current = rawRef.current.concat(batch);
      setDatasets(filterBySize(rawRef.current));
      if (batch.length < LIMIT) {
        setDone(true);
        break;
      }
      if (rawRef.current.length >= target) break;
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

  const pill = (active: boolean) =>
    `cursor-pointer border px-3 py-1.5 text-left text-sm transition-none ${
      active
        ? "border-exotic bg-exotic text-paper"
        : "border-ink/15 text-ink hover:border-exotic hover:text-exotic"
    }`;

  const [featured, ...rest] = datasets;

  return (
    <div className="grid min-w-0 gap-10 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-8">
        <div>
          <p className="label mb-3 text-ink/50">Tasks</p>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
            <button className={pill(!task)} onClick={() => setParams({ task: "" })}>
              All tasks
            </button>
            {DATASET_TASKS.map(([v, l]) => (
              <button key={v} className={pill(task === v)} onClick={() => setParams({ task: v })}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3 text-ink/50">Modalities</p>
          <div className="flex flex-wrap gap-2">
            {DATASET_MODALITIES.map(([v, l]) => (
              <button key={v} className={pill(modality === v)} onClick={() => setParams({ modality: modality === v ? "" : v })}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3 text-ink/50">Size, max rows</p>
          <div className="border border-ink/10 p-4">
            <div className="mb-4 flex items-center justify-between font-mono text-xs font-semibold">
              <span className="text-ink/40">≤</span>
              <span>{smax >= SIZE_BUCKETS.length ? ">1T (All)" : SIZE_BUCKETS[smax]}</span>
              <span className="text-xs font-normal text-ink/40">{smax >= SIZE_BUCKETS.length ? "All sizes" : "and smaller"}</span>
            </div>
            <Slider
              value={[smax]}
              min={0}
              max={SIZE_BUCKETS.length}
              step={1}
              onValueChange={([v]) => {
                setParams({ smin: "", smax: v < SIZE_BUCKETS.length ? String(v) : "" });
              }}
              aria-label="Max dataset size"
              className="[&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:rounded-none [&_[data-slot=slider-track]]:bg-ink/15 [&_[data-slot=slider-range]]:bg-exotic [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:rounded-none [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-ink [&_[data-slot=slider-thumb]]:bg-paper hover:[&_[data-slot=slider-thumb]]:border-exotic"
            />
            <p className="mt-3 text-xs text-ink/40">≤ selected bucket · unknown always shown</p>
          </div>
        </div>
        <DatasetsAdvancedSearch task={task} modality={modality} setParams={setParams} />
        <div>
          <p className="label mb-3 text-ink/50">Format</p>
          <div className="flex flex-wrap gap-2">
            {DATASET_FORMATS.map((v) => (
              <button key={v} className={pill(format === v)} onClick={() => setParams({ format: format === v ? "" : v })}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/60">
            {loading ? "Loading…" : `${datasets.length}${done ? "" : "+"} datasets`}
          </p>
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

        <div className="grid gap-4 sm:grid-cols-2">
          {featured && <FeaturedDataset d={featured} />}
          {rest.map((d) => (
            <DatasetCard key={d.id} d={d} />
          ))}
        </div>

        {!loading && datasets.length === 0 && (
          <p className="py-20 text-center text-ink/50">
            No datasets found for this filter.
          </p>
        )}

        {!done && !loading && datasets.length > 0 && (
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
