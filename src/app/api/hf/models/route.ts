import { NextRequest, NextResponse } from "next/server";
import { listModels } from "@/lib/hf";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, "hf-models", 60, 60);
  if (limited) return limited;
  const p = req.nextUrl.searchParams;
  try {
    const models = await listModels({
      q: p.get("q") ?? undefined,
      task: p.get("task") ?? undefined,
      lib: p.get("lib") ?? undefined,
      license: p.get("license") ?? undefined,
      language: p.get("lang") ?? p.get("language") ?? undefined,
      baseModel: p.get("base") ?? undefined,
      sort: p.get("sort") ?? undefined,
      limit: p.get("limit") ? Number(p.get("limit")) : undefined,
      skip: p.get("skip") ? Number(p.get("skip")) : undefined,
    });
    return NextResponse.json(models, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=600",
        "Vary": "Accept-Encoding",
      },
    });
  } catch {
    return NextResponse.json({ error: "HF fetch failed" }, { status: 502 });
  }
}
