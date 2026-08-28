import type { NextRequest } from "next/server";
import { redis } from "@/lib/redis";

interface Bucket {
  count: number;
  resetAt: number;
}

const memBuckets = new Map<string, Bucket>();
const MEM_MAX = 10_000;

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const first = fwd?.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function memHit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let b = memBuckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    memBuckets.set(key, b);
    if (memBuckets.size > MEM_MAX) {
      for (const [k, v] of memBuckets) {
        if (v.resetAt <= now) memBuckets.delete(k);
      }
    }
  }
  b.count++;
  return b.count > limit;
}

export async function rateLimit(
  req: NextRequest,
  name: string,
  limit: number,
  windowSeconds: number,
): Promise<Response | null> {
  const ip = clientIp(req);
  const windowMs = windowSeconds * 1000;
  if (memHit(`${name}:${ip}`, limit, windowMs)) {
    return tooMany(windowSeconds);
  }
  try {
    const win = Math.floor(Date.now() / windowMs);
    const key = `rl:${name}:${ip}:${win}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, windowSeconds + 60);
    if (n > limit) return tooMany(windowSeconds);
  } catch {
    // redis unavailable (local dev) — memory path already enforced
  }
  return null;
}

function tooMany(windowSeconds: number): Response {
  return Response.json(
    { error: "Too many requests. Slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(windowSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const res = await redis.set(key, "1", { ex: ttlSeconds, nx: true });
    return res === "OK";
  } catch {
    return true;
  }
}

export async function budgetSpend(
  name: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const win = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `rl-budget:${name}:${win}`;
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, windowSeconds + 60);
    return n <= max;
  } catch {
    return true;
  }
}

export class Budget {
  private n = 0;

  constructor(private readonly max: number) {}

  spend(): boolean {
    this.n++;
    return this.n <= this.max;
  }
}
