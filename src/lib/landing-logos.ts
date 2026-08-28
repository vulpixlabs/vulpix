const RASTER_LOGOS = new Set<string>([]);

/** Landing has a curated, self-hosted logo catalog and never depends on a CDN at render time. */
export function landingLogoUrl(slug: string): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9.-]/g, "");
  const extension = RASTER_LOGOS.has(safe) ? "png" : "svg";
  return `/brands/${safe || "openai"}.${extension}`;
}
