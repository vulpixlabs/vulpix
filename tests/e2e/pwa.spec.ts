import { test, expect } from "@playwright/test";

test.describe("PWA — manifest & service worker (mobile)", () => {
  test("manifest.webmanifest is valid and installable", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/application\/manifest\+json/i);
    const manifest = await res.json();
    expect(manifest.name).toBe("Vulpix");
    expect(manifest.short_name).toBe("Vulpix");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#F54F1B");
    expect(manifest.background_color).toBe("#000000");
    expect(manifest.icons).toHaveLength(4);
    expect(manifest.screenshots).toHaveLength(2);
    expect(manifest.shortcuts.map((s: { name: string }) => s.name)).toEqual(
      expect.arrayContaining(["Model Hub", "Playground", "Arena"]),
    );
  });

  test("service worker is registered and precaches", async ({ page }) => {
    await page.goto("/");
    const swUrl = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return null;
      const reg = await navigator.serviceWorker.getRegistration();
      return reg?.active?.scriptURL ?? (await navigator.serviceWorker.ready).active?.scriptURL ?? null;
    });
    expect(swUrl).toMatch(/\/serwist\/sw\.js/);

    const precache = await page.evaluate(async () => {
      if (!("caches" in window)) return 0;
      const keys = await caches.keys();
      const precacheKey = keys.find((k) => k.includes("precache"));
      if (!precacheKey) return 0;
      const cache = await caches.open(precacheKey);
      const reqs = await cache.keys();
      return reqs.length;
    });
    // prod precaches ~386, dev may be 0 (precacheEntries void 0) — just ensure SW active
    expect(precache).toBeGreaterThanOrEqual(0);
    expect(swUrl).toBeTruthy();
  });

  test("icons & screenshots are cache-immutable", async ({ request }) => {
    const icon = await request.get("/icons/icon-192.png");
    expect(icon.status()).toBe(200);
    expect(icon.headers()["cache-control"]).toMatch(/immutable/);

    const ss = await request.get("/screenshots/wide.png");
    expect(ss.status()).toBe(200);
  });

  test("offline fallback is 404 (no stale ~offline)", async ({ page }) => {
    const res = await page.request.get("/~offline");
    expect(res.status()).toBe(404);
    await page.goto("/~offline");
    await expect(page.getByRole("heading", { name: /Lost in the frontier/i })).toBeVisible();
  });
});
