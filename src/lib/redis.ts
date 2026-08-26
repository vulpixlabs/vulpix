import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { __vulpixRedis?: Redis };

function createClient(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return new Redis(url, {
    maxRetriesPerRequest: 2,
    connectTimeout: 10_000,
    enableOfflineQueue: false,
    lazyConnect: false,
  });
}

export const redis: Redis = globalForRedis.__vulpixRedis ?? createClient();

if (process.env.NODE_ENV !== "production") globalForRedis.__vulpixRedis = redis;

export async function getJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[redis] GET ${key} failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function setJson(key: string, value: unknown, exSeconds?: number): Promise<boolean> {
  try {
    const raw = JSON.stringify(value);
    if (exSeconds && exSeconds > 0) await redis.set(key, raw, "EX", exSeconds);
    else await redis.set(key, raw);
    return true;
  } catch (err) {
    console.error(`[redis] SET ${key} failed:`, err instanceof Error ? err.message : err);
    return false;
  }
}
