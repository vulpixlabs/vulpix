import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getJson, setJson } from "@/lib/redis";
import {
  combineModels,
  fetchActivity,
  fetchBenchmarks,
  fetchHFModels,
  fetchOpenRouterModels,
  type HFMeta,
  type ORSpec,
} from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HF_KEY = "models:huggingface:data";
const OR_KEY = "models:openrouter:data";
const COMBINED_KEY = "models:all:combined";
const BENCH_KEY = "models:openrouter:benchmarks";
const ACT_KEY = "models:openrouter:activity";
const LAST_HF_KEY = "models:last:hf";
const LAST_OR_KEY = "models:last:or";
const LAST_BENCH_KEY = "models:last:bench";
const LAST_ACT_KEY = "models:last:act";

const HF_TTL_SECONDS = 14_400; // 4 hours
const OR_TTL_SECONDS = 14_400; // 4 hours
const ARENA_TTL_SECONDS = 14_400; // 4 hours
const HF_INTERVAL_MS = 4 * 60 * 60 * 1000;
const OR_INTERVAL_MS = 4 * 60 * 60 * 1000;
const ARENA_INTERVAL_MS = 4 * 60 * 60 * 1000;

type SyncStatus = "skipped" | "synced" | "failed";

interface SyncResult {
  ok: boolean;
  hf: SyncStatus;
  or: SyncStatus;
  bench: SyncStatus;
  act: SyncStatus;
  combined: number;
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function combineFromRedis(): Promise<number> {
  const [hf, or] = await Promise.all([
    getJson<HFMeta[]>(HF_KEY),
    getJson<ORSpec[]>(OR_KEY),
  ]);
  if (!hf?.length && !or?.length) return 0;
  const combined = combineModels(hf ?? [], or ?? []);
  const stored = await setJson(COMBINED_KEY, combined, OR_TTL_SECONDS);
  return stored ? combined.length : 0;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force");
  const now = Date.now();
  const [lastHF, lastOR, lastBench, lastAct] = await Promise.all([
    getJson<number>(LAST_HF_KEY),
    getJson<number>(LAST_OR_KEY),
    getJson<number>(LAST_BENCH_KEY),
    getJson<number>(LAST_ACT_KEY),
  ]);

  const shouldHF =
    force === "hf" || force === "all" || !lastHF || now - lastHF >= HF_INTERVAL_MS;
  const shouldOR =
    force === "or" || force === "all" || !lastOR || now - lastOR >= OR_INTERVAL_MS;
  const shouldBench =
    force === "bench" || force === "all" || !lastBench || now - lastBench >= ARENA_INTERVAL_MS;
  const shouldAct =
    force === "act" || force === "all" || !lastAct || now - lastAct >= ARENA_INTERVAL_MS;

  const result: SyncResult = {
    ok: true,
    hf: "skipped",
    or: "skipped",
    bench: "skipped",
    act: "skipped",
    combined: 0,
  };

  if (shouldHF) {
    const models = await fetchHFModels();
    if (models?.length) {
      await setJson(HF_KEY, models, HF_TTL_SECONDS);
      await setJson(LAST_HF_KEY, now);
      result.hf = "synced";
    } else {
      result.hf = "failed";
    }
  }

  if (shouldOR) {
    const models = await fetchOpenRouterModels();
    if (models?.length) {
      await setJson(OR_KEY, models, OR_TTL_SECONDS);
      await setJson(LAST_OR_KEY, now);
      result.or = "synced";
    } else {
      result.or = "failed";
    }
  }

  if (shouldBench) {
    const bench = await fetchBenchmarks();
    if (bench && (Object.keys(bench.aa).length || Object.keys(bench.da).length)) {
      await setJson(BENCH_KEY, bench, ARENA_TTL_SECONDS);
      await setJson(LAST_BENCH_KEY, now);
      result.bench = "synced";
    } else {
      result.bench = "failed";
    }
  }

  if (shouldAct) {
    const act = await fetchActivity();
    if (act && Object.keys(act.series).length) {
      await setJson(ACT_KEY, act, ARENA_TTL_SECONDS);
      await setJson(LAST_ACT_KEY, now);
      result.act = "synced";
    } else {
      result.act = "failed";
    }
  }

  result.combined = await combineFromRedis();

  const failures = [result.hf, result.or, result.bench, result.act].filter(
    (s) => s === "failed",
  ).length;
  if (failures >= 2) result.ok = false;

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
