import { NextRequest } from "next/server";
import { streamText, tool, convertToModelMessages, createUIMessageStreamResponse, type UIMessage } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { providerById } from "@/lib/playground/providers";
import { rateLimit } from "@/lib/rate-limit";
import { assertPublicHttpsUrl } from "@/lib/ssrf";

export const maxDuration = 120;

const MAX_BODY_BYTES = 256 * 1024;

const tavilySearch = (apiKey: string) =>
  tool({
    description: "Search the web for current information. Returns results with title, URL and content snippet.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }),
    execute: async ({ query }) => {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query, max_results: 6, search_depth: "advanced" }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`Tavily error ${res.status}`);
      const data = await res.json();
      return {
        results: (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 1200),
        })),
      };
    },
  });

function resolveModel(providerId: string, model: string, apiKey: string, customBase?: string) {
  const provider = providerById(providerId);
  if (!provider && !providerId.startsWith("custom-")) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  if (providerId.startsWith("custom-")) {
    if (!customBase) throw new Error("Custom endpoint base URL missing");
    return createOpenAICompatible({ name: providerId, apiKey, baseURL: customBase })(model);
  }
  switch (provider!.kind) {
    case "openai": {
      const openai = createOpenAI({ apiKey, ...(provider!.baseURL ? { baseURL: provider!.baseURL } : {}) });
      return openai(model);
    }
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "compatible": {
      const compat = createOpenAICompatible({
        name: provider!.id,
        apiKey: apiKey || "none",
        baseURL: customBase ?? provider!.baseURL ?? "https://api.openai.com/v1",
      });
      return compat(model);
    }
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "pg-chat", 20, 300);
  if (limited) return limited;

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: {
    provider?: string;
    model?: string;
    apiKey?: string;
    baseURL?: string;
    messages?: UIMessage[];
    system?: string;
    temperature?: number;
    maxTokens?: number;
    tavilyKey?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { provider: providerId, model, apiKey, baseURL, messages, system, temperature, maxTokens, tavilyKey } = body;
  if (!providerId || !model || !Array.isArray(messages)) {
    return Response.json({ error: "Missing provider, model or messages" }, { status: 400 });
  }

  try {
    if (baseURL) await assertPublicHttpsUrl(baseURL);
    const modelInstance = resolveModel(providerId, model, apiKey ?? "", baseURL);

    const result = streamText({
      model: modelInstance,
      system,
      messages: await convertToModelMessages(messages),
      ...(typeof temperature === "number" && temperature !== 0.7 ? { temperature } : {}),
      ...(typeof maxTokens === "number" && maxTokens > 0 ? { maxOutputTokens: maxTokens } : {}),
      ...(tavilyKey ? { tools: { web_search: tavilySearch(tavilyKey) } } : {}),
      onError: ({ error }) => {
        console.error("[playground] stream error:", error instanceof Error ? error.message : error);
      },
    });

    return createUIMessageStreamResponse({
      stream: result.toUIMessageStream({
        originalMessages: messages,
        onError: () => {
          return "Upstream provider error. Check your key/model and try again.";
        },
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const rejected = /401|invalid.*key|unauthorized/i.test(msg);
    return Response.json(
      { error: rejected ? "Provider rejected the API key" : "Failed to start stream" },
      { status: rejected ? 401 : 500 },
    );
  }
}
