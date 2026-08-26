import { NextRequest, NextResponse } from "next/server";
import { getJson, setJson } from "@/lib/redis";
import { fetchBenchmarks, type ArenaBenchmarks } from "@/lib/sync";
import { acquireLock, budgetSpend, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BENCH_KEY = "models:openrouter:benchmarks";

const HEADERS = {
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
  "Vary": "Accept-Encoding",
} as const;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, "arena-bench", 20, 60);
  if (limited) return NextResponse.json(await limited.json(), { status: limited.status, headers: limited.headers });

  const cached = await getJson<ArenaBenchmarks>(BENCH_KEY);
  if (cached) {
    return NextResponse.json({ source: "redis", ...cached }, { headers: HEADERS });
  }

  const locked = await acquireLock("models:arena:lock:bench", 60);
  const budgetOk = await budgetSpend("bench-live", 10, 60);
  if (!locked || !budgetOk) {
    return NextResponse.json(
      { error: "benchmarks syncing, retry shortly" },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "5" } },
    );
  }

  const clientKey = req.headers.get("x-or-key") ?? undefined;
  const live = await fetchBenchmarks(clientKey);
  if (live) {
    await setJson(BENCH_KEY, live, 21600);
    return NextResponse.json({ source: "live", ...live }, { headers: HEADERS });
  }

  return NextResponse.json(
    { error: "benchmarks unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
