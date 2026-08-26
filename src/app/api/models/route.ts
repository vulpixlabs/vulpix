import { NextRequest, NextResponse } from "next/server";
import { getJson, setJson } from "@/lib/redis";
import {
  combineModels,
  fetchHFModels,
  fetchOpenRouterModels,
  type CombinedModel,
  type HFMeta,
  type ORSpec,
} from "@/lib/sync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HF_KEY = "models:huggingface:data";
const OR_KEY = "models:openrouter:data";
const COMBINED_KEY = "models:all:combined";
const COMBINED_TTL_SECONDS = 7_200;

interface ModelsResponse {
  count: number;
  total: number;
  source: "redis-combined" | "redis-recombined" | "live-fallback";
  models: CombinedModel[];
}

async function loadCombined(): Promise<{
  models: CombinedModel[];
  source: ModelsResponse["source"];
} | null> {
  const cached = await getJson<CombinedModel[]>(COMBINED_KEY);
  if (cached?.length) return { models: cached, source: "redis-combined" };

  const [hf, or] = await Promise.all([
    getJson<HFMeta[]>(HF_KEY),
    getJson<ORSpec[]>(OR_KEY),
  ]);
  if (hf?.length || or?.length) {
    const models = combineModels(hf ?? [], or ?? []);
    if (models.length) {
      await setJson(COMBINED_KEY, models, COMBINED_TTL_SECONDS);
      return { models, source: "redis-recombined" };
    }
  }

  const [liveHF, liveOR] = await Promise.all([fetchHFModels(), fetchOpenRouterModels()]);
  if (liveHF?.length || liveOR?.length) {
    const models = combineModels(liveHF ?? [], liveOR ?? []);
    if (models.length) return { models, source: "live-fallback" };
  }

  return null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 500, 1), 1_000);
  const offset = Math.max(Number(sp.get("offset")) || 0, 0);

  const loaded = await loadCombined();
  if (!loaded) {
    return NextResponse.json(
      { error: "model data unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let list = loaded.models;
  if (q) {
    list = list.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }

  const body: ModelsResponse = {
    count: Math.min(list.length - offset, limit),
    total: list.length,
    source: loaded.source,
    models: list.slice(offset, offset + limit),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=86400, stale-if-error=600",
      "Vary": "Accept-Encoding",
    },
  });
}
