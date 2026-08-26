import { NextRequest, NextResponse } from "next/server";
import { getJson, setJson } from "@/lib/redis";
import { fetchActivity, type ArenaActivity } from "@/lib/sync";
import { acquireLock, budgetSpend, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ACT_KEY = "models:openrouter:activity";

function matchSeries(series: Record<string, ArenaActivity["series"][string]>, slug: string) {
  const exact = series[slug];
  if (exact) return exact;
  const prefix = `${slug}-`;
  const variantPrefix = `${slug}:`;
  let best: ArenaActivity["series"][string] | null = null;
  let bestTotal = 0;
  for (const [key, rows] of Object.entries(series)) {
    if (key === slug || key.startsWith(prefix) || key.startsWith(variantPrefix)) {
      const total = rows.reduce((acc, r) => acc + r.tokens, 0);
      if (total > bestTotal) {
        bestTotal = total;
        best = rows;
      }
    }
  }
  return best;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, "arena-act", 20, 60);
  if (limited) return NextResponse.json(await limited.json(), { status: limited.status, headers: limited.headers });

  const sp = req.nextUrl.searchParams;
  const slugs = (sp.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!slugs.length) {
    return NextResponse.json({ error: "slugs required" }, { status: 400 });
  }

  let data: ArenaActivity | null = await getJson<ArenaActivity>(ACT_KEY);
  let source: "redis" | "live" | "none" = "redis";
  if (!data) {
    const locked = await acquireLock("models:arena:lock:act", 60);
    const budgetOk = await budgetSpend("act-live", 10, 60);
    if (locked && budgetOk) {
      const clientKey = req.headers.get("x-or-key") ?? undefined;
      data = await fetchActivity(clientKey);
      source = "live";
      if (data && Object.keys(data.series).length) {
        await setJson(ACT_KEY, data, 21600);
      }
    }
  }

  const out: Record<string, { date: string; tokens: number }[]> = {};
  if (data) {
    for (const slug of slugs) {
      const rows = matchSeries(data.series, slug);
      if (rows) out[slug] = [...rows].sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
    }
  }

  return NextResponse.json(
    { source: Object.keys(out).length ? source : "none", series: out },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200", "Vary": "Accept-Encoding" } },
  );
}
