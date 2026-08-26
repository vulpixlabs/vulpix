export interface HFMeta {
  id: string;
  author: string;
  likes: number;
  downloads: number;
  pipelineTag: string | null;
  tags: string[];
  createdAt: string | null;
  lastModified: string | null;
}

export interface ORPricing {
  prompt: number | null;
  completion: number | null;
  request: number | null;
  image: number | null;
  webSearch: number | null;
  internalReasoning: number | null;
  inputCacheRead: number | null;
  inputCacheWrite: number | null;
}

export interface ORArchitecture {
  inputModalities: string[];
  outputModalities: string[];
  modality: string | null;
  tokenizer: string | null;
}

export interface ORSpec {
  id: string;
  name: string;
  created: number | null;
  description: string | null;
  contextLength: number | null;
  maxCompletionTokens: number | null;
  pricing: ORPricing;
  architecture: ORArchitecture | null;
  supportedParameters: string[];
}

export interface CombinedModel {
  id: string;
  name: string;
  hf: HFMeta | null;
  or: ORSpec | null;
}

type RawRecord = Record<string, unknown>;

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function splitId(id: string): string {
  const slash = id.indexOf("/");
  return slash === -1 ? id : id.slice(0, slash);
}

export async function fetchHFModels(): Promise<HFMeta[] | null> {
  try {
    const headers: Record<string, string> = {};
    if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
    const res = await fetch(
      "https://huggingface.co/api/models?limit=100&sort=likes&direction=-1",
      { headers, cache: "no-store", signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) {
      console.error(`[sync] HF models HTTP ${res.status}`);
      return null;
    }
    const raw = (await res.json()) as RawRecord[];
    return raw
      .filter((m) => typeof m.id === "string")
      .map((m) => ({
        id: m.id as string,
        author: str(m.author) ?? splitId(m.id as string),
        likes: num(m.likes) ?? 0,
        downloads: num(m.downloads) ?? 0,
        pipelineTag: str(m.pipeline_tag),
        tags: strArray(m.tags).slice(0, 12),
        createdAt: str(m.createdAt),
        lastModified: str(m.lastModified),
      }));
  } catch (err) {
    console.error("[sync] HF fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function fetchOpenRouterModels(): Promise<ORSpec[] | null> {
  try {
    const headers: Record<string, string> = {};
    if (process.env.OPENROUTER_API_KEY) {
      headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`;
    }
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[sync] OpenRouter models HTTP ${res.status}`);
      return null;
    }
    const body = (await res.json()) as { data?: RawRecord[] };
    const list = Array.isArray(body.data) ? body.data : [];
    return list
      .filter((m) => typeof m.id === "string")
      .map((m) => {
        const pricingRaw = (m.pricing ?? {}) as RawRecord;
        const archRaw = (m.architecture ?? null) as RawRecord | null;
        const topProvider = (m.top_provider ?? {}) as RawRecord;
        return {
          id: m.id as string,
          name: str(m.name) ?? (m.id as string),
          created: num(m.created),
          description: str(m.description),
          contextLength: num(m.context_length) ?? num(topProvider.context_length),
          maxCompletionTokens: num(topProvider.max_completion_tokens),
          pricing: {
            prompt: num(pricingRaw.prompt),
            completion: num(pricingRaw.completion),
            request: num(pricingRaw.request),
            image: num(pricingRaw.image),
            webSearch: num(pricingRaw.web_search),
            internalReasoning: num(pricingRaw.internal_reasoning),
            inputCacheRead: num(pricingRaw.input_cache_read),
            inputCacheWrite: num(pricingRaw.input_cache_write),
          },
          architecture: archRaw
            ? {
                inputModalities: strArray(archRaw.input_modalities),
                outputModalities: strArray(archRaw.output_modalities),
                modality: str(archRaw.modality),
                tokenizer: str(archRaw.tokenizer),
              }
            : null,
          supportedParameters: strArray(m.supported_parameters),
        };
      });
  } catch (err) {
    console.error("[sync] OpenRouter fetch failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

export interface ArenaBenchmarks {
  aa: Record<string, { slug: string; displayName: string; intelligence: number | null; coding: number | null; agentic: number | null }>;
  da: Record<string, Record<string, { elo: number; winRate: number; avgGenMs: number | null }>>;
  asOf: string;
}

export interface ArenaActivity {
  series: Record<string, { date: string; tokens: number }[]>;
  asOf: string;
}

function orHeaders(explicitKey?: string): Record<string, string> {
  const key = explicitKey ?? process.env.OPENROUTER_API_KEY;
  const headers: Record<string, string> = {};
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function fetchJsonOr<T>(url: string, key?: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: orHeaders(key),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(`[sync] ${url} HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[sync] ${url} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function fetchBenchmarks(key?: string): Promise<ArenaBenchmarks | null> {
  const aaRaw = await fetchJsonOr<{ data?: RawRecord[] }>(
    "https://openrouter.ai/api/v1/benchmarks?source=artificial-analysis",
    key,
  );
  const daRaw = await fetchJsonOr<{ data?: RawRecord[] }>(
    "https://openrouter.ai/api/v1/benchmarks?source=design-arena",
    key,
  );
  if (!aaRaw?.data && !daRaw?.data) return null;

  const aa: ArenaBenchmarks["aa"] = {};
  for (const item of aaRaw?.data ?? []) {
    const slug = str(item.model_permaslug);
    if (!slug) continue;
    aa[slug] = {
      slug,
      displayName: str(item.display_name) ?? slug,
      intelligence: num(item.intelligence_index),
      coding: num(item.coding_index),
      agentic: num(item.agentic_index),
    };
  }

  const da: ArenaBenchmarks["da"] = {};
  for (const item of daRaw?.data ?? []) {
    const slug = str(item.model_permaslug);
    const category = str(item.category);
    if (!slug || !category) continue;
    const elo = num(item.elo);
    if (elo == null) continue;
    da[slug] ??= {};
    da[slug][category] = {
      elo,
      winRate: num(item.win_rate) ?? 0,
      avgGenMs: num(item.avg_generation_time_ms),
    };
  }

  return { aa, da, asOf: new Date().toISOString() };
}

export async function fetchActivity(key?: string): Promise<ArenaActivity | null> {
  const raw = await fetchJsonOr<{ data?: RawRecord[] }>(
    "https://openrouter.ai/api/v1/datasets/rankings-daily?period=day",
    key,
  );
  if (!raw?.data) return null;

  const series: ArenaActivity["series"] = {};
  for (const row of raw.data) {
    const slug = str(row.model_permaslug);
    const date = str(row.date);
    const tokens = num(row.total_tokens);
    if (!slug || !date || tokens == null || slug === "other") continue;
    (series[slug] ??= []).push({ date, tokens });
  }
  return { series, asOf: new Date().toISOString() };
}

export async function fetchEndpoints(slug: string, key?: string): Promise<RawRecord[] | null> {
  const safe = slug.replace(/[^a-zA-Z0-9._/-]/g, "");
  const raw = await fetchJsonOr<RawRecord>(
    `https://openrouter.ai/api/v1/models/${safe}/endpoints`,
    key,
  );
  const data = raw?.data as RawRecord | undefined;
  const endpoints = data?.endpoints;
  return Array.isArray(endpoints) ? (endpoints as RawRecord[]) : null;
}

export function combineModels(hf: HFMeta[], or: ORSpec[]): CombinedModel[] {
  const map = new Map<string, CombinedModel>();

  for (const spec of or) {
    map.set(normalizeId(spec.id), { id: spec.id, name: spec.name, hf: null, or: spec });
  }
  for (const meta of hf) {
    const key = normalizeId(meta.id);
    const existing = map.get(key);
    if (existing) {
      existing.hf = meta;
      if (!existing.or) existing.name = meta.id;
    } else {
      map.set(key, { id: meta.id, name: meta.id, hf: meta, or: null });
    }
  }
  return Array.from(map.values());
}
