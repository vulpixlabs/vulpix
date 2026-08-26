import { NextRequest, NextResponse } from "next/server";
import { getJson, setJson } from "@/lib/redis";
import { fetchEndpoints } from "@/lib/sync";
import { acquireLock, budgetSpend, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CACHE_TTL = 3_600;
const NEG_TTL = 120;
const SLUG_RE = /^[a-z0-9._-]+\/[a-z0-9._-]+$/;

interface ProviderInfo {
  name: string;
  quantization: string | null;
  promptPerToken: number | null;
  completionPerToken: number | null;
}

interface ProvidersResponse {
  slug: string;
  providers: ProviderInfo[];
  weightedInputPerToken: number | null;
  source: "redis" | "live" | "none";
}

function parseProviders(raw: Record<string, unknown>[]): {
  providers: ProviderInfo[];
  weighted: number | null;
} {
  const providers: ProviderInfo[] = [];
  for (const e of raw) {
    const name =
      (typeof e.provider_name === "string" && e.provider_name) ||
      (typeof e.name === "string" && e.name) ||
      null;
    if (!name) continue;
    const pricing = (e.pricing ?? {}) as Record<string, unknown>;
    const num = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v)
        ? v
        : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))
          ? Number(v)
          : null;
    providers.push({
      name,
      quantization: typeof e.quantization === "string" ? e.quantization : null,
      promptPerToken: num(pricing.prompt),
      completionPerToken: num(pricing.completion),
    });
  }
  const inputs = providers.map((p) => p.promptPerToken).filter((v): v is number => v != null);
  const weighted = inputs.length
    ? inputs.reduce((a, b) => a + b, 0) / inputs.length
    : null;
  return { providers, weighted };
}

function empty(slug: string): ProvidersResponse {
  return { slug, providers: [], weightedInputPerToken: null, source: "none" };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, "arena-providers", 30, 60);
  if (limited) return NextResponse.json(await limited.json(), { status: limited.status, headers: limited.headers });

  const rawSlug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase() ?? "";
  if (!SLUG_RE.test(rawSlug) || rawSlug.length > 120) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const clientKey = req.headers.get("x-or-key") ?? undefined;

  const cacheKey = `models:providers:${rawSlug}`;
  const cached = await getJson<ProvidersResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(
      { ...cached, source: "redis" },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200", "Vary": "Accept-Encoding" } },
    );
  }

  const negAt = await getJson<number>(`models:providers:neg:${rawSlug}`);
  if (negAt && Date.now() - negAt < 60_000) {
    return NextResponse.json(empty(rawSlug), { headers: { "Cache-Control": "no-store" } });
  }

  const locked = await acquireLock(`models:providers:lock:${rawSlug}`, 60);
  const budgetOk = await budgetSpend("providers-live", 40, 60);
  if (!locked || !budgetOk) {
    return NextResponse.json(empty(rawSlug), { headers: { "Cache-Control": "no-store" } });
  }

  const endpoints = await fetchEndpoints(rawSlug, clientKey);
  if (!endpoints?.length) {
    await setJson(`models:providers:neg:${rawSlug}`, Date.now(), NEG_TTL).catch(() => false);
    return NextResponse.json(
      empty(rawSlug),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { providers, weighted } = parseProviders(endpoints);
  const body: ProvidersResponse = {
    slug: rawSlug,
    providers,
    weightedInputPerToken: weighted,
    source: "live",
  };
  await setJson(cacheKey, body, CACHE_TTL);
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200", "Vary": "Accept-Encoding" },
  });
}
