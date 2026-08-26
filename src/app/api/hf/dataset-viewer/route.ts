import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const DS_SERVER = "https://datasets-server.huggingface.co";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, "hf-viewer", 60, 60);
  if (limited) return limited;
  const id = req.nextUrl.searchParams.get("dataset");
  if (!id) return NextResponse.json({ error: "missing dataset" }, { status: 400 });
  const clean = (v: string | null) => (v ?? "").replace(/[^A-Za-z0-9._/-]/g, "").slice(0, 120);
  const config = clean(req.nextUrl.searchParams.get("config")) || "default";
  const split = clean(req.nextUrl.searchParams.get("split")) || "train";
  const offsetNum = Math.max(0, Number.parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10) || 0);
  const lengthNum = Math.min(Math.max(Number.parseInt(req.nextUrl.searchParams.get("length") ?? "10", 10) || 10, 1), 100);
  const u = new URL(`${DS_SERVER}/rows`);
  u.searchParams.set("dataset", id.slice(0, 200));
  u.searchParams.set("config", config);
  u.searchParams.set("split", split);
  u.searchParams.set("offset", String(offsetNum));
  u.searchParams.set("length", String(lengthNum));
  const headers: HeadersInit = {};
  if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  try {
    const res = await fetch(u, { headers, next: { revalidate: 60 } });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "viewer fetch failed" }, { status: 502 });
  }
}
