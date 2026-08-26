import { NextRequest } from "next/server";
import { providerById } from "@/lib/playground/providers";
import { rateLimit } from "@/lib/rate-limit";
import { assertPublicHttpsUrl } from "@/lib/ssrf";

export const dynamic = "force-dynamic";

export interface ModelInfo {
  id: string;
  name?: string;
  contextLength?: number;
  promptPrice?: number;
  completionPrice?: number;
  created?: number;
}

const cache = new Map<string, { at: number; models: ModelInfo[] }>();
const TTL = 10 * 60 * 1000;

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

async function loadOpenRouter(): Promise<ModelInfo[]> {
  const data = await fetchJson("https://openrouter.ai/api/v1/models");
  return (data.data ?? []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    contextLength: num(m.context_length),
    promptPrice: num((m.pricing as Record<string, unknown>)?.prompt),
    completionPrice: num((m.pricing as Record<string, unknown>)?.completion),
    created: num(m.created),
  }));
}

async function loadOpenAiCompatible(baseURL: string, key: string): Promise<ModelInfo[]> {
  const data = await fetchJson(`${baseURL.replace(/\/$/, "")}/models`, {
    Authorization: `Bearer ${key}`,
  });
  const raw: unknown[] = Array.isArray(data) ? data : (data.data ?? data.models ?? []);
  return raw.map((m) => {
    const rec = m as Record<string, unknown>;
    const id = String(rec.id ?? rec.name ?? "");
    return {
      id,
      name: typeof rec.display_name === "string" ? rec.display_name : undefined,
      contextLength: num(rec.context_length ?? rec.context_window ?? rec.max_model_len),
      created: num(rec.created),
    };
  }).filter((m) => m.id);
}

async function loadAnthropic(key: string): Promise<ModelInfo[]> {
  const data = await fetchJson("https://api.anthropic.com/v1/models?limit=100", {
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
  });
  return (data.data ?? []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.display_name as string,
    contextLength: num(m.context_window ?? 200000),
    created: num(m.created_at ? Date.parse(m.created_at as string) / 1000 : undefined),
  }));
}

async function loadGoogle(key: string): Promise<ModelInfo[]> {
  const data = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(key)}`
  );
  return (data.models ?? [])
    .filter((m: Record<string, unknown>) =>
      ((m.supportedGenerationMethods as string[]) ?? []).includes("generateContent")
    )
    .map((m: Record<string, unknown>) => ({
      id: String(m.name ?? "").replace(/^models\//, ""),
      name: m.displayName as string,
      contextLength: num(m.inputTokenLimit),
    }));
}

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, "pg-models", 30, 60);
  if (limited) return limited;
  const providerId = req.nextUrl.searchParams.get("provider") ?? "";
  const baseParam = req.nextUrl.searchParams.get("base");
  const provider = providerById(providerId);
  if (!provider && providerId !== "custom") {
    return Response.json({ error: "unknown provider" }, { status: 400 });
  }

  const key = req.headers.get("x-pg-key") ?? "";
  const baseURL = providerId === "custom" ? (baseParam ?? "") : (provider?.baseURL ?? "");
  if (providerId === "custom" && !baseURL) {
    return Response.json({ error: "base URL required" }, { status: 400 });
  }
  if (providerId === "custom") {
    try {
      await assertPublicHttpsUrl(baseURL);
    } catch (e) {
      return Response.json(
        { models: [], fallback: true, error: e instanceof Error ? e.message : "invalid base URL" },
        { status: 200 }
      );
    }
  }
  const cacheKey = `${providerId}:${baseURL}:${key ? "k" : "pub"}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) {
    return Response.json({ models: hit.models, cached: true });
  }

  try {
    let models: ModelInfo[];
    if (providerId === "custom") {
      if (!key) throw new Error("key required");
      models = await loadOpenAiCompatible(baseURL, key);
    } else if (provider!.id === "openrouter") {
      models = await loadOpenRouter();
    } else if (provider!.kind === "anthropic") {
      if (!key) throw new Error("key required");
      models = await loadAnthropic(key);
    } else if (provider!.kind === "google") {
      if (!key) throw new Error("key required");
      models = await loadGoogle(key);
    } else {
      if (!key && !provider!.local) throw new Error("key required");
      models = await loadOpenAiCompatible(provider!.baseURL ?? "https://api.openai.com/v1", key || "none");
    }
    models.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    cache.set(cacheKey, { at: Date.now(), models });
    return Response.json({ models });
  } catch (e) {
    const fallback = providerId === "custom" ? [] : provider!.fallbackModels.map((id) => ({ id }));
    return Response.json(
      { models: fallback, fallback: true, error: e instanceof Error ? e.message : "failed" },
      { status: 200 }
    );
  }
}
