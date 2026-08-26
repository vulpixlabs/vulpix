import { NextRequest, NextResponse } from "next/server";
import { safeAuthor } from "@/lib/brand-logos";
import { rateLimit } from "@/lib/rate-limit";
import { fallbackLogoSvg } from "@/lib/logo-fallback";

const HF_API = "https://huggingface.co/api";
const ALLOWED_PREFIXES = [
  "https://cdn-avatars.huggingface.co/",
  "https://huggingface.co/avatars/",
];

async function resolveAvatar(author: string): Promise<string | null> {
  const headers: HeadersInit = process.env.HF_TOKEN
    ? { Authorization: `Bearer ${process.env.HF_TOKEN}` }
    : {};
  for (const kind of ["organizations", "users"]) {
    try {
      const res = await fetch(`${HF_API}/${kind}/${author}/avatar`, {
        headers,
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { avatarUrl?: string };
      const url = data.avatarUrl;
      if (url && ALLOWED_PREFIXES.some((p) => url.startsWith(p))) {
        return url;
      }
    } catch {
      // try next kind
    }
  }
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ author: string }> }
) {
  const { author: raw } = await ctx.params;
  const author = safeAuthor(decodeURIComponent(raw));
  if (!author) {
    return NextResponse.json({ error: "invalid author" }, { status: 400 });
  }
  const limited = await rateLimit(req, "hf-avatar", 120, 60);
  if (limited) return limited;

  const url = await resolveAvatar(author);
  if (url) {
    try {
      const response = await fetch(url, {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8_000),
      });
      const type = response.headers.get("content-type") ?? "";
      if (response.ok && type.startsWith("image/")) {
        return new Response(await response.arrayBuffer(), {
          headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "Content-Type": type,
            "X-Content-Type-Options": "nosniff",
            "X-Vulpix-Logo-Source": "huggingface",
          },
        });
      }
    } catch {
      // Render the deterministic fallback below.
    }
  }

  return new Response(fallbackLogoSvg(author, "111111"), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Vulpix-Logo-Source": "neutral-fallback",
    },
  });
}
