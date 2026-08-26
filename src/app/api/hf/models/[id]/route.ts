import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/hf";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(_req, "hf-model-detail", 120, 60);
  if (limited) return limited;
  const { id } = await params;
  try {
    const model = await getModel(decodeURIComponent(id));
    return NextResponse.json(model, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        "Vary": "Accept-Encoding",
      },
    });
  } catch {
    return NextResponse.json({ error: "HF fetch failed" }, { status: 502 });
  }
}
