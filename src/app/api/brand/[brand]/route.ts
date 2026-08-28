import { NextRequest } from "next/server";
import { fallbackLogoSvg } from "@/lib/logo-fallback";

type BrandSource = {
  simpleIcon?: string;
  svgl?: string;
  domain?: string;
};

const BRANDS: Record<string, BrandSource> = {
  "01dotai": { simpleIcon: "01dotai", domain: "01.ai" },
  anthropic: { simpleIcon: "anthropic", domain: "anthropic.com" },
  cerebras: { svgl: "cerebras-dark.svg", domain: "cerebras.ai" },
  cohere: { simpleIcon: "cohere", svgl: "cohere.svg", domain: "cohere.com" },
  dashscope: { simpleIcon: "qwen", domain: "qwen.ai" },
  databricks: { simpleIcon: "databricks", domain: "databricks.com" },
  deepinfra: { domain: "deepinfra.com" },
  deepseek: { simpleIcon: "deepseek", domain: "deepseek.com" },
  "deepseek-ai": { simpleIcon: "deepseek", domain: "deepseek.com" },
  elevenlabs: { simpleIcon: "elevenlabs", domain: "elevenlabs.io" },
  fireworks: { domain: "fireworks.ai" },
  gemini: { simpleIcon: "googlegemini", domain: "gemini.google.com" },
  google: { simpleIcon: "google", domain: "google.com" },
  googlegemini: { simpleIcon: "googlegemini", domain: "gemini.google.com" },
  "google-deepmind": { simpleIcon: "googlegemini", domain: "deepmind.google" },
  googlecolab: { simpleIcon: "googlecolab", domain: "colab.research.google.com" },
  groq: { svgl: "groq.svg", domain: "groq.com" },
  huggingface: { svgl: "hugging_face.svg", domain: "huggingface.co" },
  intel: { simpleIcon: "intel", domain: "intel.com" },
  kaggle: { simpleIcon: "kaggle", domain: "kaggle.com" },
  lmstudio: { simpleIcon: "lmstudio", domain: "lmstudio.ai" },
  meta: { simpleIcon: "meta", domain: "meta.ai" },
  "meta-llama": { simpleIcon: "meta", domain: "meta.ai" },
  microsoft: { simpleIcon: "microsoft", svgl: "microsoft.svg", domain: "microsoft.com" },
  minimax: { simpleIcon: "minimax", domain: "minimax.io" },
  mistral: { simpleIcon: "mistralai", domain: "mistral.ai" },
  mistralai: { simpleIcon: "mistralai", domain: "mistral.ai" },
  moonshot: { simpleIcon: "moonshotai", domain: "moonshot.ai" },
  moonshotai: { simpleIcon: "moonshotai", domain: "moonshot.ai" },
  nebius: { domain: "nebius.com" },
  nvidia: { simpleIcon: "nvidia", domain: "nvidia.com" },
  novita: { domain: "novita.ai" },
  ollama: { svgl: "ollama_light.svg", domain: "ollama.com" },
  openai: { simpleIcon: "openai", svgl: "openai.svg", domain: "openai.com" },
  openrouter: { simpleIcon: "openrouter", domain: "openrouter.ai" },
  perplexity: { simpleIcon: "perplexity", svgl: "perplexity.svg", domain: "perplexity.ai" },
  qwen: { simpleIcon: "qwen", domain: "qwen.ai" },
  replicate: { simpleIcon: "replicate", domain: "replicate.com" },
  sambanova: { domain: "sambanova.ai" },
  siliconflow: { domain: "siliconflow.com" },
  stabilityai: { simpleIcon: "stabilityai", svgl: "stability-ai.svg", domain: "stability.ai" },
  together: { svgl: "togetherai_light.svg", domain: "together.ai" },
  upstage: { simpleIcon: "upstage", domain: "upstage.ai" },
  tencent: { domain: "tencent.com" },
  cognitivecomputations: { domain: "cognitivecomputations.com" },
  "vercel-gateway": { simpleIcon: "vercel", svgl: "vercel_dark.svg", domain: "vercel.com" },
  xai: { simpleIcon: "xai", svgl: "xai_light.svg", domain: "x.ai" },
  zai: { domain: "z.ai" },
  zhipu: { domain: "zhipuai.cn" },
};

const CACHE = "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000";

function candidates(source: BrandSource, color: string): string[] {
  const urls: string[] = [];
  if (source.simpleIcon) {
    urls.push(`https://cdn.simpleicons.org/${source.simpleIcon}/${color}`);
  }
  if (source.svgl) urls.push(`https://svgl.app/library/${source.svgl}`);
  if (source.domain) {
    urls.push(`https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`);
  }
  return urls;
}

async function fetchLogo(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(8_000),
    });
    const type = response.headers.get("content-type") ?? "";
    const length = Number(response.headers.get("content-length") ?? 0);
    if (!response.ok || !type.startsWith("image/") || length > 1_000_000) return null;
    const body = await response.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > 1_000_000) return null;
    return new Response(body, {
      headers: {
        "Cache-Control": CACHE,
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ brand: string }> },
) {
  const { brand: raw } = await ctx.params;
  const brand = decodeURIComponent(raw).toLowerCase();
  const colorParam = req.nextUrl.searchParams.get("color") ?? "000000";
  const color = /^[0-9a-f]{6}$/i.test(colorParam) ? colorParam : "000000";
  const source = BRANDS[brand] ?? { domain: `${brand}.com` };

  for (const url of candidates(source, color)) {
    const response = await fetchLogo(url);
    if (response) return response;
  }
  // try .ai fallback for unknown brands
  if (!BRANDS[brand]) {
    const alt = await fetchLogo(`https://www.google.com/s2/favicons?domain=${brand}.ai&sz=128`);
    if (alt) return alt;
  }

  return new Response(fallbackLogoSvg(brand, color), {
    headers: {
      "Cache-Control": CACHE,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
