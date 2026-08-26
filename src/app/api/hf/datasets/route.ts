import { NextRequest, NextResponse } from "next/server";
import { listDatasets } from "@/lib/hf";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, "hf-datasets", 60, 60);
  if (limited) return limited;
  const p = req.nextUrl.searchParams;
  try {
    const datasets = await listDatasets({
      q: p.get("q") ?? undefined,
      task: p.get("task") ?? undefined,
      modality: p.get("modality") ?? undefined,
      format: p.get("format") ?? undefined,
      sort: p.get("sort") ?? undefined,
      limit: p.get("limit") ? Number(p.get("limit")) : undefined,
      skip: p.get("skip") ? Number(p.get("skip")) : undefined,
    });
    return NextResponse.json(datasets, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=600",
        "Vary": "Accept-Encoding",
      },
    });
  } catch {
    return NextResponse.json({ error: "HF fetch failed" }, { status: 502 });
  }
}
