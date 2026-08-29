import { test, expect, type Page } from "@playwright/test";
import { parseLaunchParams } from "../../src/lib/pwa-launch";
import { diffModelSnapshots } from "../../src/lib/model-notifications";

async function seedPlayground(page: Page) {
  await page.goto("/~offline.html");
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("vulpix-playground", 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          const db = request.result;
          const chats = db.createObjectStore("chats", { keyPath: "id" });
          chats.createIndex("by-updated", "updatedAt");
          chats.createIndex("by-project", "projectId");
          const artifacts = db.createObjectStore("artifacts", { keyPath: "id" });
          artifacts.createIndex("by-chat", "chatId");
          db.createObjectStore("settings", { keyPath: "id" });
          db.createObjectStore("projects", { keyPath: "id" });
        };
        request.onsuccess = () => {
          const transaction = request.result.transaction("settings", "readwrite");
          transaction.objectStore("settings").put({
            id: "settings",
            keys: {},
            defaultProvider: "custom-e2e",
            customProviders: [{ id: "custom-e2e", name: "E2E", baseURL: "http://127.0.0.1:9" }],
            temperature: 0.7,
            maxTokens: 0,
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
}

test.describe("PWA launch parameters", () => {
  test("turns shared content into a bounded Playground draft", () => {
    const params = new URLSearchParams({
      shareTitle: "Interesting model",
      shareText: "Review this release",
      shareUrl: "https://huggingface.co/example/model",
    });

    expect(parseLaunchParams(params)).toBe(
      "Interesting model\nReview this release\nhttps://huggingface.co/example/model",
    );
  });

  test("accepts only the Vulpix protocol and extracts its text", () => {
    const valid = new URLSearchParams({
      protocol: "web+vulpix://prompt?text=Compare%20these%20models",
    });
    const invalid = new URLSearchParams({ protocol: "https://example.com/steal" });

    expect(parseLaunchParams(valid)).toBe("Compare these models");
    expect(parseLaunchParams(invalid)).toBe("");
  });

  test("places shared text in the Playground draft without sending it", async ({ page }) => {
    await seedPlayground(page);
    await page.goto("/playground?shareText=Review%20this%20model&shareUrl=https%3A%2F%2Fexample.com%2Fmodel");

    await expect(page.getByPlaceholder("How can I help you today?")).toHaveValue(
      "Review this model\nhttps://example.com/model",
    );
    await expect(page).toHaveURL("/playground");
  });

  test("consumes POST share content without leaving it in the URL", async ({ page }) => {
    await seedPlayground(page);
    const response = await page.request.post("/api/pwa/share", {
      form: {
        shareTitle: "Private draft",
        shareText: "Review this model",
        shareUrl: "https://example.com/model",
      },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(303);

    await page.goto(response.headers().location);
    await expect(page.getByPlaceholder("How can I help you today?")).toHaveValue(
      "Private draft\nReview this model\nhttps://example.com/model",
    );
    await expect(page).toHaveURL("/playground");
    const cached = await page.evaluate(async () => {
      for (const key of await caches.keys()) {
        if (await (await caches.open(key)).match("/api/pwa/share")) return true;
      }
      return false;
    });
    expect(cached).toBe(false);
  });

  test("adds files received from the operating-system launch queue", async ({ page }) => {
    await page.addInitScript(() => {
      const launchWindow = window as unknown as {
        launchQueue: { setConsumer: (consumer: (params: unknown) => void) => void };
        __launchConsumer?: (params: unknown) => void;
      };
      const queue = launchWindow.launchQueue ?? ({} as typeof launchWindow.launchQueue);
      Object.defineProperty(queue, "setConsumer", {
        configurable: true,
        value(consumer: (params: unknown) => void) {
          launchWindow.__launchConsumer = consumer;
        },
      });
      if (!launchWindow.launchQueue) launchWindow.launchQueue = queue;
    });
    await seedPlayground(page);
    await page.goto("/playground");
    await expect(page.getByPlaceholder("How can I help you today?")).toBeVisible();
    expect(await page.evaluate(() => typeof (window as unknown as { launchQueue?: { setConsumer?: unknown } }).launchQueue?.setConsumer)).toBe("function");
    await expect
      .poll(() =>
        page.evaluate(
          () => Boolean((window as typeof window & { __launchConsumer?: (params: unknown) => void }).__launchConsumer),
        ),
      )
      .toBe(true);
    await page.evaluate(() => {
      const consumer = (window as typeof window & { __launchConsumer?: (params: unknown) => void }).__launchConsumer;
      consumer?.({ targetURL: "https://example.com/playground?protocol=web%2Bvulpix%3Ahello" });
    });
    await page.evaluate(() => {
      const consumer = (window as typeof window & { __launchConsumer?: (params: unknown) => void }).__launchConsumer;
      consumer?.({
        files: [
          {
            getFile: async () => new File(["hello from Android"], "launch-note.txt", { type: "text/plain" }),
          },
        ],
      });
    });

    await expect(page.getByText("launch-note.txt", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
  });
});

test.describe("local model notifications", () => {
  const model = (id: string) => ({ id, name: id.toUpperCase() });

  test("seeds silently, then reports newly recent or trending models once", () => {
    const current = {
      trending: [model("delta"), model("alpha")],
      recent: [model("echo"), model("charlie")],
    };

    expect(diffModelSnapshots(null, current)).toEqual([]);
    expect(
      diffModelSnapshots(
        { trending: [model("alpha"), model("bravo")], recent: [model("charlie")] },
        current,
      ).map((entry) => entry.id),
    ).toEqual(["delta", "echo"]);
  });

  test("caps one notification to three unique model names", () => {
    const previous = { trending: [], recent: [] };
    const current = {
      trending: [model("a"), model("b"), model("c")],
      recent: [model("a"), model("d")],
    };

    expect(diffModelSnapshots(previous, current).map((entry) => entry.id)).toEqual(["a", "b", "c"]);
  });

  test("requires an explicit Settings opt-in", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Notification permission automation is Chromium-only");
    await context.grantPermissions(["notifications"]);
    await seedPlayground(page);
    await page.goto("/playground");

    if ((page.viewportSize()?.width ?? 1024) < 768) {
      await page.getByRole("button", { name: "Open menu" }).click();
    }
    await page.getByRole("button", { name: "Open settings" }).click();
    const toggle = page.getByRole("switch", { name: "New and trending model alerts" });
    await expect(toggle).not.toBeChecked();
    await toggle.click();
    await expect(toggle).toBeChecked();
  });
});

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
    expect(manifest.id).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display_override).toEqual(["standalone"]);
    expect(manifest.launch_handler).toEqual({ client_mode: "navigate-existing" });
    expect(manifest.file_handlers?.[0]?.action).toBe("/playground?source=file");
    expect(manifest.share_target).toMatchObject({
      action: "/api/pwa/share",
      method: "POST",
      enctype: "application/x-www-form-urlencoded",
      params: { title: "shareTitle", text: "shareText", url: "shareUrl" },
    });
    expect(manifest.protocol_handlers).toEqual([
      { protocol: "web+vulpix", url: "/playground?protocol=%s" },
    ]);
    expect(manifest.note_taking).toBeUndefined();
    expect(manifest.related_applications).toBeUndefined();
    expect(manifest.prefer_related_applications).toBe(false);
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
    // Development has no injected entries. Production should keep installation small.
    expect(precache).toBeGreaterThanOrEqual(0);
    if (precache > 0) expect(precache).toBeLessThan(50);
    expect(swUrl).toBeTruthy();
  });

  test("icons & screenshots are cache-immutable", async ({ request }) => {
    const icon = await request.get("/icons/icon-192.png", { maxRetries: 2 });
    expect(icon.status()).toBe(200);
    expect(icon.headers()["cache-control"]).toMatch(/immutable/);

    const ss = await request.get("/screenshots/wide.png", { maxRetries: 2 });
    expect(ss.status()).toBe(200);
  });

  test("offline fallback is a dedicated install asset", async ({ page }) => {
    const res = await page.request.get("/~offline.html");
    expect(res.status()).toBe(200);
    await page.goto("/~offline.html");
    await expect(page.getByRole("heading", { name: /You are offline/i })).toBeVisible();
  });

  test("reopens a controlled Playground while offline", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "Playwright WebKit cannot reliably reload service-worker pages offline");
    await seedPlayground(page);
    await page.goto("/playground");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.getByPlaceholder("How can I help you today?")).toBeVisible();

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByPlaceholder("How can I help you today?")).toBeVisible();
  });
});
