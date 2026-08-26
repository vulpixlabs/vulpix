import { NextRequest } from "next/server";
import { providerById } from "@/lib/playground/providers";
import { rateLimit } from "@/lib/rate-limit";
import { assertPublicHttpsUrl } from "@/lib/ssrf";

export const dynamic = "force-dynamic";

async function fetchCustomModels(start: URL, apiKey?: string): Promise<Response> {
  let current = start;
  for (let hop = 0; hop < 4; hop++) {
    const attempt = await fetch(current, {
      headers: { Authorization: `Bearer ${apiKey || "none"}` },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    if (attempt.status >= 300 && attempt.status < 400) {
      const loc = attempt.headers.get("location");
      if (!loc) return attempt;
      current = new URL(loc, current);
      await assertPublicHttpsUrl(current.toString());
      continue;
    }
    return attempt;
  }
  throw new Error("Too many redirects");
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "pg-test", 10, 60);
  if (limited) return limited;

  const { provider: providerId, apiKey, baseURL } = (await req.json().catch(() => ({}))) as {
    provider?: string;
    apiKey?: string;
    baseURL?: string;
  };
  const isCustom = providerId === "custom";
  const provider = providerById(providerId ?? "");
  if (!provider && !isCustom) {
    return Response.json({ ok: false, error: "Unknown provider" }, { status: 400 });
  }
  if (!apiKey && !provider?.local && !isCustom) {
    return Response.json({ ok: false, error: "API key required" });
  }

  try {
    if (isCustom) {
      if (!baseURL) throw new Error("Base URL required");
      const start = await assertPublicHttpsUrl(baseURL);
      const res = await fetchCustomModels(start, apiKey);
      if (!res.ok) throw new Error(res.status === 401 ? "Invalid key" : `HTTP ${res.status}, check base URL`);
      return Response.json({ ok: true });
    }
    if (provider!.id === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/key", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Invalid key" : `HTTP ${res.status}`);
      return Response.json({ ok: true });
    }
    if (provider!.kind === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": apiKey ?? "", "anthropic-version": "2023-06-01" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Invalid key" : `HTTP ${res.status}`);
      return Response.json({ ok: true });
    }
    if (provider!.kind === "google") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(apiKey ?? "")}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) throw new Error(res.status === 400 || res.status === 403 ? "Invalid key" : `HTTP ${res.status}`);
      return Response.json({ ok: true });
    }
    const res = await fetch(`${(provider!.baseURL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${apiKey || "none"}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(res.status === 401 ? "Invalid key" : `HTTP ${res.status}`);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Connection failed" });
  }
}
