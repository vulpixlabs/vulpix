import { NextRequest, NextResponse } from "next/server";
import { getReadmeSummary } from "@/lib/hf";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await rateLimit(req, "hf-readme", 120, 60);
  if (limited) return limited;
  const id = req.nextUrl.searchParams.get("id");
  const kind = (req.nextUrl.searchParams.get("kind") as "model" | "dataset") ?? "model";
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  try {
    const summary = await getReadmeSummary(id, kind);
    return NextResponse.json({ summary }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ summary: null }, { status: 200 });
  }
}
