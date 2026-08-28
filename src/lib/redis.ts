import { Redis } from "@upstash/redis";

// Upstash REST — direct (not via Vercel Marketplace). Reads UPSTASH_REDIS_REST_URL/TOKEN from env.
const globalForRedis = globalThis as unknown as { __vulpixRedis?: Redis };

function createClient(): Redis {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN is not set");
  }
  return Redis.fromEnv();
}

export const redis: Redis = globalForRedis.__vulpixRedis ?? createClient();

if (process.env.NODE_ENV !== "production") globalForRedis.__vulpixRedis = redis;

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (raw === null || raw === undefined) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }
    return raw as T;
  } catch (err) {
    console.error(`[redis] GET ${key} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function setJson(key: string, value: unknown, exSeconds?: number): Promise<boolean> {
  try {
    const raw = JSON.stringify(value);
    if (exSeconds && exSeconds > 0) await redis.set(key, raw, { ex: exSeconds });
    else await redis.set(key, raw);
    return true;
  } catch (err) {
    console.error(`[redis] SET ${key} failed:`, err instanceof Error ? err.message : err);
    return false;
  }
}
