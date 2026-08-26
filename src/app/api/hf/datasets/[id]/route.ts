import { NextRequest, NextResponse } from "next/server";
import { getDataset } from "@/lib/hf";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(_req, "hf-dataset-detail", 120, 60);
  if (limited) return limited;
  const { id } = await params;
  try {
    const dataset = await getDataset(decodeURIComponent(id));
    return NextResponse.json(dataset, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        "Vary": "Accept-Encoding",
      },
    });
  } catch {
    return NextResponse.json({ error: "HF fetch failed" }, { status: 502 });
  }
}
