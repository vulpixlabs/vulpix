const MAX_DRAFT_LENGTH = 8_000;

export function parseLaunchParams(params: URLSearchParams): string {
  const shared = ["shareTitle", "shareText", "shareUrl"]
    .map((key) => params.get(key)?.trim() ?? "")
    .filter(Boolean);

  const rawProtocol = params.get("protocol");
  if (rawProtocol) {
    try {
      const protocolUrl = new URL(rawProtocol);
      if (protocolUrl.protocol === "web+vulpix:") {
        const text = protocolUrl.searchParams.get("text")?.trim();
        if (text) shared.push(text);
      }
    } catch {
      // Invalid protocol payloads are ignored rather than reflected into the UI.
    }
  }

  return [...new Set(shared)].join("\n").slice(0, MAX_DRAFT_LENGTH);
}
