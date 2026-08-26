export type BrandLogo = { url: string; name: string };

const SIMPLE_ICONS: Record<string, string> = {
  qwen: "qwen",
  "deepseek-ai": "deepseek",
  deepseek: "deepseek",
  meta: "meta",
  facebook: "meta",
  "google-deepmind": "googlegemini",
  google: "googlegemini",
  mistralai: "mistralai",
  "mistral-community": "mistralai",
  moonshotai: "moonshotai",
  minimax: "minimax",
  nvidia: "nvidia",
  anthropic: "anthropic",
  intel: "intel",
};

const SVGL: Record<string, string> = {
  openai: "https://svgl.app/library/openai.svg",
  xai: "https://svgl.app/library/xai_light.svg",
  stabilityai: "https://svgl.app/library/stability-ai.svg",
  microsoft: "https://svgl.app/library/microsoft.svg",
  ibm: "https://svgl.app/library/ibm.svg",
  cohere: "https://svgl.app/library/cohere.svg",
  perplexity: "https://svgl.app/library/perplexity.svg",
  huggingface: "https://svgl.app/library/hugging_face.svg",
};

export function openRouterModelLogo(id: string): string {
  const provider = (id.split("/")[0] ?? "").toLowerCase();
  return brandAssetUrl(provider);
}

export function brandAssetUrl(brand: string, color = "000000"): string {
  const key = brand.toLowerCase().replace(/[^a-z0-9.-]/g, "");
  const safeColor = /^[0-9a-f]{6}$/i.test(color) ? color : "000000";
  return `/api/brand/${encodeURIComponent(key || "unknown")}?color=${safeColor}`;
}

export function brandLogo(author?: string): BrandLogo | null {
  if (!author) return null;
  const key = author.toLowerCase().replace(/[^a-z0-9.-]/g, "");
  const si = SIMPLE_ICONS[key];
  if (si) return { url: brandAssetUrl(key), name: author };
  const sv = SVGL[key];
  if (sv) return { url: brandAssetUrl(key), name: author };
  return null;
}

const AUTHOR_SAFE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?$/;

export function safeAuthor(author?: string | null): string | null {
  if (!author) return null;
  return AUTHOR_SAFE.test(author) ? author : null;
}

export function hfColabUrl(id: string): string {
  const parts = id.split("/");
  if (parts.length !== 2 || !parts.every((p) => AUTHOR_SAFE.test(p))) {
    return "https://huggingface.co/models";
  }
  return `https://huggingface.co/${parts[0]}/${parts[1]}/colab`;
}

export function hfDatasetViewerUrl(id: string): string {
  return `https://huggingface.co/datasets/${id}/viewer`;
}

export function kaggleUrl(id: string): string {
  return `https://www.kaggle.com/models/${id}`;
}

export function formatBytes(n?: number): string {
  if (n == null) return "";
  if (n >= 1_073_741_824) return `${(n / 1_073_741_824).toFixed(2)} GB`;
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(2)} MB`;
  if (n >= 1_024) return `${(n / 1_024).toFixed(1)} kB`;
  return `${n} B`;
}
