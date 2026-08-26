const HF = "https://huggingface.co";

const ID_RE = /^[\w][\w.-]*(\/[\w.-]+)*$/;

function assertId(id: string): string {
  if (!ID_RE.test(id) || id.includes("..")) throw new Error("invalid id");
  return id;
}

function hfHeaders(): HeadersInit {
  const h: Record<string, string> = {};
  if (process.env.HF_TOKEN) h.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  return h;
}

export type HFModel = {
  id: string;
  author?: string;
  likes: number;
  downloads: number;
  downloadsAllTime?: number;
  pipeline_tag?: string;
  library_name?: string;
  tags?: string[];
  createdAt?: string;
  lastModified?: string;
  safetensors?: { total?: number; parameters?: number };
  inferenceProviderMapping?: { provider?: string; status?: string } | null;
  gated?: string | boolean;
};

export type HFDataset = {
  id: string;
  author?: string;
  likes: number;
  downloads: number;
  downloadsAllTime?: number;
  tags?: string[];
  createdAt?: string;
  lastModified?: string;
  siblings?: { rfilename: string }[];
};

export const LANGUAGES: [string, string][] = [
  ["en", "English"],
  ["zh", "Chinese"],
  ["fr", "French"],
  ["de", "German"],
  ["es", "Spanish"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["id", "Indonesian"],
  ["multilingual", "Multilingual"],
];

export async function listModels(opts: {
  q?: string;
  task?: string;
  lib?: string;
  license?: string;
  language?: string;
  baseModel?: string;
  sort?: string;
  limit?: number;
  skip?: number;
}): Promise<HFModel[]> {
  const u = new URL(`${HF}/api/models`);
  if (opts.q) u.searchParams.set("search", opts.q);
  if (opts.task) u.searchParams.set("pipeline_tag", opts.task);
  if (opts.lib) u.searchParams.set("library", opts.lib);
  if (opts.license) u.searchParams.set("filter", `license:${opts.license}`);
  if (opts.language) u.searchParams.set("language", opts.language);
  if (opts.baseModel) u.searchParams.set("filter", `base_model:finetune:${opts.baseModel}`);
  u.searchParams.set("sort", opts.sort ?? "trendingScore");
  u.searchParams.set("direction", "-1");
  u.searchParams.set("limit", String(opts.limit ?? 30));
  if (opts.skip) u.searchParams.set("skip", String(opts.skip));
  for (const e of [
    "downloads",
    "likes",
    "pipeline_tag",
    "library_name",
    "lastModified",
    "tags",
    "safetensors",
    "inferenceProviderMapping",
    "downloadsAllTime",
  ]) {
    u.searchParams.append("expand[]", e);
  }
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 60 }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`HF models ${res.status}`);
  return res.json();
}

export async function getModel(id: string) {
  const u = new URL(`${HF}/api/models/${assertId(id)}`);
  for (const e of [
    "siblings",
    "safetensors",
    "inferenceProviderMapping",
    "downloadsAllTime",
    "cardData",
    "downloads",
    "likes",
    "lastModified",
    "pipeline_tag",
    "library_name",
    "gated",
  ]) {
    u.searchParams.append("expand[]", e);
  }
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`HF model ${res.status}`);
  return res.json();
}

export async function listAdapters(id: string, kind: "finetune" | "quantized") {
  const u = new URL(`${HF}/api/models`);
  u.searchParams.set("filter", `base_model:${kind}:${id}`);
  u.searchParams.set("limit", "6");
  u.searchParams.set("sort", "downloads");
  u.searchParams.set("direction", "-1");
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 300 } });
  if (!res.ok) return [];
  return res.json();
}

export type HFTreeEntry = {
  type: string;
  oid: string;
  size: number;
  path: string;
};

export async function listTree(id: string): Promise<HFTreeEntry[]> {
  const u = new URL(`${HF}/api/models/${assertId(id)}/tree/main`);
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function listDatasetTree(id: string): Promise<HFTreeEntry[]> {
  const u = new URL(`${HF}/api/datasets/${assertId(id)}/tree/main`);
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 300 } });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export const PIPELINE_TAXONOMY: { label: string; color: string; items: [string, string][] }[] = [
  {
    label: "Computer Vision",
    color: "cv",
    items: [
      ["depth-estimation", "Depth Estimation"],
      ["image-classification", "Image Classification"],
      ["object-detection", "Object Detection"],
      ["image-segmentation", "Image Segmentation"],
      ["text-to-image", "Text-to-Image"],
      ["image-text-to-text", "Image-to-Text"],
      ["image-to-image", "Image-to-Image"],
      ["image-to-video", "Image-to-Video"],
      ["unconditional-image-generation", "Unconditional Image Generation"],
      ["video-classification", "Video Classification"],
      ["text-to-video", "Text-to-Video"],
      ["zero-shot-image-classification", "Zero-Shot Image Classification"],
      ["mask-generation", "Mask Generation"],
      ["zero-shot-object-detection", "Zero-Shot Object Detection"],
      ["text-to-3d", "Text-to-3D"],
      ["image-to-3d", "Image-to-3D"],
      ["image-feature-extraction", "Image Feature Extraction"],
      ["keypoint-detection", "Keypoint Detection"],
      ["video-to-video", "Video-to-Video"],
    ],
  },
  {
    label: "Natural Language Processing",
    color: "nlp",
    items: [
      ["text-classification", "Text Classification"],
      ["token-classification", "Token Classification"],
      ["table-question-answering", "Table Question Answering"],
      ["question-answering", "Question Answering"],
      ["zero-shot-classification", "Zero-Shot Classification"],
      ["translation", "Translation"],
      ["summarization", "Summarization"],
      ["feature-extraction", "Feature Extraction"],
      ["text-generation", "Text Generation"],
      ["fill-mask", "Fill-Mask"],
      ["sentence-similarity", "Sentence Similarity"],
      ["text-ranking", "Text Ranking"],
    ],
  },
  {
    label: "Audio",
    color: "audio",
    items: [
      ["text-to-speech", "Text-to-Speech"],
      ["text-to-audio", "Text-to-Audio"],
      ["automatic-speech-recognition", "Automatic Speech Recognition"],
      ["audio-to-audio", "Audio-to-Audio"],
      ["audio-classification", "Audio Classification"],
      ["voice-activity-detection", "Voice Activity Detection"],
    ],
  },
  {
    label: "Tabular",
    color: "tabular",
    items: [
      ["tabular-classification", "Tabular Classification"],
      ["tabular-regression", "Tabular Regression"],
      ["time-series-forecasting", "Time Series Forecasting"],
    ],
  },
  {
    label: "Reinforcement Learning",
    color: "rl",
    items: [
      ["reinforcement-learning", "Reinforcement Learning"],
      ["robotics", "Robotics"],
    ],
  },
];

export const DATASET_TASKS: [string, string][] = [
  ["text-generation", "Text Generation"],
  ["text-classification", "Text Classification"],
  ["question-answering", "Question Answering"],
  ["translation", "Translation"],
  ["summarization", "Summarization"],
  ["token-classification", "Token Classification"],
  ["text-retrieval", "Text Retrieval"],
  ["image-classification", "Image Classification"],
  ["automatic-speech-recognition", "Speech Recognition"],
  ["text-to-speech", "Text-to-Speech"],
];

export const SIZE_BUCKETS = [
  "n<1K",
  "1K<n<100K",
  "100K<n<1M",
  "1M<n<10M",
  "10M<n<100M",
  "100M<n<1B",
  "1B<n<10B",
  "10B<n<100B",
  "100B<n<1T",
  ">1T",
] as const;

export const DATASET_MODALITIES: [string, string][] = [
  ["text", "Text"],
  ["image", "Image"],
  ["audio", "Audio"],
  ["video", "Video"],
  ["3d", "3D"],
  ["tabular", "Tabular"],
  ["time-series", "Time-series"],
  ["geospatial", "Geospatial"],
  ["document", "Document"],
];

export const DATASET_FORMATS = [
  "json",
  "csv",
  "parquet",
  "optimized-parquet",
  "imagefolder",
  "soundfolder",
  "webdataset",
  "text",
  "arrow",
];

export async function listDatasets(opts: {
  q?: string;
  task?: string;
  modality?: string;
  format?: string;
  sort?: string;
  limit?: number;
  skip?: number;
}): Promise<HFDataset[]> {
  const u = new URL(`${HF}/api/datasets`);
  if (opts.q) u.searchParams.set("search", opts.q);
  if (opts.task) u.searchParams.set("filter", `task_categories:${opts.task}`);
  if (opts.modality) u.searchParams.append("filter", `modality:${opts.modality}`);
  if (opts.format) u.searchParams.append("filter", `format:${opts.format}`);
  u.searchParams.set("sort", opts.sort ?? "trendingScore");
  u.searchParams.set("direction", "-1");
  u.searchParams.set("limit", String(opts.limit ?? 30));
  if (opts.skip) u.searchParams.set("skip", String(opts.skip));
  for (const e of ["downloads", "likes", "lastModified", "downloadsAllTime", "tags"]) {
    u.searchParams.append("expand[]", e);
  }
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 60 }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`HF datasets ${res.status}`);
  return res.json();
}

export function datasetTask(tags?: string[]): string | null {
  const t = tags?.find((x) => x.startsWith("task_categories:"));
  return t ? t.replace("task_categories:", "") : null;
}

export function datasetSize(tags?: string[]): string | null {
  const t = tags?.find((x) => x.startsWith("size_categories:"));
  return t ? t.replace("size_categories:", "").replace("n", "<").replace("10B<100B", "10–100B") : null;
}

export async function getDataset(id: string) {
  const u = new URL(`${HF}/api/datasets/${assertId(id)}`);
  for (const e of ["siblings", "downloadsAllTime", "cardData", "downloads", "likes", "lastModified"]) {
    u.searchParams.append("expand[]", e);
  }
  const res = await fetch(u, { headers: hfHeaders(), next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`HF dataset ${res.status}`);
  return res.json();
}

export function avatarUrl(author?: string) {
  return author ? `${HF}/${author}.svg` : null;
}

export function dsViewerUrl(id: string): string {
  return `https://huggingface.co/datasets/${id}/viewer`;
}

export function dsColabUrl(id: string): string {
  return `https://colab.research.google.com/github/huggingface/notebooks/blob/main/datasets/${id}.ipynb`;
}

export async function getReadmeSummary(id: string, kind: "model" | "dataset"): Promise<string | null> {
  try {
    assertId(id);
    const card = kind === "dataset" ? await getDataset(id).catch(() => null) : await getModel(id).catch(() => null);
    const fromCard = (card as { cardData?: { description?: string } } | null)?.cardData?.description?.trim();
    if (fromCard && fromCard.length > 20) return fromCard;
    const base = kind === "dataset" ? `${HF}/datasets/${id}` : `${HF}/${id}`;
    let md: string | null = null;
    for (const branch of ["main", "master"]) {
      const rawUrl = `${base}/raw/${branch}/README.md`;
      const res = await fetch(rawUrl, { headers: hfHeaders(), next: { revalidate: 3600 } });
      if (res.ok) { md = await res.text(); break; }
    }
    if (!md) return fromCard ?? null;
    if (md.trimStart().startsWith("---")) {
      const end = md.indexOf("\n---", 3);
      if (end !== -1) md = md.slice(end + 4);
    }
    const lines = md.split("\n");
    let buf = "";
    for (const ln of lines) {
      const t = ln.trim();
      if (!t) { if (buf.trim()) { const out = buf.trim(); if (out.length > 40) return out; buf = ""; } continue; }
      if (t.startsWith("#") || t.startsWith("```") || t.startsWith("|") || t.startsWith("![") || t.startsWith("<")) {
        if (buf.trim() && buf.trim().length > 40) break;
        continue;
      }
      if (/^[a-z_]+:/.test(t) && !t.includes(" ")) { if (buf.trim()) { const out = buf.trim(); if (out.length > 40) return out; buf = ""; } continue; }
      if (t.startsWith("- ") || t.startsWith("* ") || t.startsWith("[")) continue;
      buf += (buf ? " " : "") + t;
      if (buf.length > 800) break;
    }
    const out = buf.trim().replace(/\s+/g, " ");
    if (out && out.length > 40) return out;
    return fromCard ?? out ?? null;
  } catch {
    return null;
  }
}

export function usageSnippet(id: string, lib?: string, task?: string): string {
  if (lib === "diffusers") {
    return `from diffusers import DiffusionPipeline\nimport torch\n\npipe = DiffusionPipeline.from_pretrained(\n    "${id}", torch_dtype=torch.float16\n)\npipe.to("cuda")\n\nimage = pipe("a photorealistic mountain at sunrise").images[0]\nimage.save("output.png")`;
  }
  const t = task && task !== "text-generation" ? task : "text-generation";
  return `from transformers import pipeline\nimport torch\n\npipe = pipeline(\n    "${t}",\n    model="${id}",\n    torch_dtype=torch.float16,\n    device_map="auto",\n)\n\nout = pipe("Hello, how are you today?")\nprint(out)`;
}

export function formatNum(n?: number): string {
  if (n == null) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatParams(total?: number): string | null {
  if (!total) return null;
  const b = total / 1e9;
  if (b >= 1000) return `${(b / 1000).toFixed(1)}T`;
  if (b >= 1) return `${b.toFixed(b >= 10 ? 0 : 1)}B`;
  return `${(total / 1e6).toFixed(0)}M`;
}

export function timeAgo(iso?: string): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.round(s / 86400)}d ago`;
  return `${Math.round(s / 2592000)}mo ago`;
}
