export function formatTokensCompact(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "-";
  if (n >= 1e12) return `${trimDec(n / 1e12)}T`;
  if (n >= 1e9) return `${trimDec(n / 1e9)}B`;
  if (n >= 1e6) return `${trimDec(n / 1e6)}M`;
  if (n >= 1e3) return `${trimDec(n / 1e3)}K`;
  return String(Math.round(n));
}

export function formatPricePerM(perToken: number | null): string {
  if (perToken == null) return "-";
  const perM = perToken * 1_000_000;
  if (perM === 0) return "$0";
  if (perM >= 100) return `$${Math.round(perM)}`;
  if (perM >= 1) return `$${trimDec(perM)}`;
  return `$${trimDec(perM, 3)}`;
}

export function trimDec(v: number, max = 2): string {
  const s = v.toFixed(max);
  return s.replace(/\.?0+$/, "").replace(".", ",");
}

export function formatIntId(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

export function formatCompactEn(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function monthLabel(timestampMs: number): string {
  return new Date(timestampMs).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function permaBase(id: string): string {
  return id.split("/").pop()?.split(":")[0]?.replace(/-\d{8}$/, "") ?? id;
}

export function matchKey<T>(record: Record<string, T>, id: string): T | undefined {
  if (record[id] !== undefined) return record[id];
  const base = permaBase(id);
  const hit = Object.keys(record).find((k) => k === base || k.startsWith(`${base}-`) || k === id || k.startsWith(`${id}-`) || k.startsWith(`${id}:`));
  return hit !== undefined ? record[hit] : undefined;
}
