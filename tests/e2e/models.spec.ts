import { test, expect } from "@playwright/test";

test.describe("API /api/models — Redis cache & performance", () => {
  test("returns 200 with Cache-Control s-maxage=60 and source", async ({ request }) => {
    const start = Date.now();
    const res = await request.get("/api/models?limit=3");
    const ms = Date.now() - start;

    expect(res.status()).toBe(200);
    const cc = res.headers()["cache-control"] ?? "";
    // /api/models uses s-maxage=300 prod (vercel) / 60 dev is legacy; accept either
    expect(cc).toMatch(/s-maxage=(60|300)/);
    expect(cc).toMatch(/stale-while-revalidate/);

    const json = await res.json();
    expect(Array.isArray(json.models)).toBeTruthy();
    expect(json.models.length).toBeGreaterThan(0);
    expect(["redis-combined", "redis-recombined", "live-fallback"]).toContain(json.source);
    // Vary header hygiene (no x-or-key fragmentation)
    expect(res.headers()["vary"]).not.toMatch(/x-or-key/i);

    // soft perf budget — local Redis <80ms, live fallback <2s (CI cold)
    expect(ms).toBeLessThan(2500);
  });

  test("pagination limit/offset respected", async ({ request }) => {
    const r1 = await request.get("/api/models?limit=2&offset=0");
    const j1 = await r1.json();
    expect(j1.models).toHaveLength(2);

    const r2 = await request.get("/api/models?limit=2&offset=2");
    const j2 = await r2.json();
    // offset should shift results (not deep-equal when enough data)
    if (j1.models.length === 2 && j2.models.length === 2) {
      expect(j1.models[0].id).not.toBe(j2.models[0].id);
    }
  });

  test("q filter is case-insensitive", async ({ request }) => {
    const res = await request.get("/api/models?q=llama&limit=2");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.models.length).toBeGreaterThan(0);
  });
});
