/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";
import { diffModelSnapshots, type ModelNotificationEntry, type ModelSnapshot } from "../lib/model-notifications";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const MODEL_SYNC_TAG = "vulpix-model-updates";
const MODEL_SNAPSHOT_CACHE = "vulpix-model-snapshot-v1";
const MODEL_SNAPSHOT_URL = "/__vulpix/model-snapshot";

async function modelNotificationsEnabled() {
  if (!("databases" in indexedDB)) return false;
  const databases = await indexedDB.databases();
  if (!databases.some((database) => database.name === "vulpix-playground")) return false;

  return new Promise<boolean>((resolve) => {
    const request = indexedDB.open("vulpix-playground", 1);
    request.onerror = () => resolve(false);
    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("settings")) {
        database.close();
        resolve(false);
        return;
      }
      const transaction = database.transaction("settings", "readonly");
      const settings = transaction.objectStore("settings").get("settings");
      settings.onerror = () => resolve(false);
      settings.onsuccess = () => resolve(settings.result?.modelNotifications === true);
      transaction.oncomplete = () => database.close();
    };
  });
}

async function fetchModelList(sort: "trendingScore" | "createdAt"): Promise<ModelNotificationEntry[]> {
  const response = await fetch(`/api/hf/models?sort=${sort}&limit=10`);
  if (!response.ok) throw new Error(`Model check failed: ${response.status}`);
  const body = (await response.json()) as unknown;
  if (!Array.isArray(body)) return [];
  return body
    .filter((model): model is { id: string } => Boolean(model && typeof model === "object" && "id" in model && typeof model.id === "string"))
    .map((model) => ({ id: model.id, name: model.id.split("/").at(-1) ?? model.id }));
}

async function checkModelUpdates() {
  if (!(await modelNotificationsEnabled())) return false;
  const [trending, recent] = await Promise.all([
    fetchModelList("trendingScore"),
    fetchModelList("createdAt"),
  ]);
  const current: ModelSnapshot = { trending, recent };
  const cache = await caches.open(MODEL_SNAPSHOT_CACHE);
  const snapshotRequest = new Request(new URL(MODEL_SNAPSHOT_URL, self.location.origin));
  const previousResponse = await cache.match(snapshotRequest);
  const previous = previousResponse ? ((await previousResponse.json()) as ModelSnapshot) : null;
  const changed = diffModelSnapshots(previous, current);
  await cache.put(snapshotRequest, new Response(JSON.stringify(current), { headers: { "Content-Type": "application/json" } }));

  if (changed.length && Notification.permission === "granted" && await modelNotificationsEnabled()) {
    await self.registration.showNotification("New and trending models", {
      body: changed.map((model) => model.name).join(", "),
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: MODEL_SYNC_TAG,
      data: { url: "/hub?view=models&sort=trendingScore" },
    });
  }
  return true;
}

// Keep documents fresh while retaining visited pages for genuine offline use.
const runtimeCaching = defaultCache.map((entry) => {
  const name = (entry as unknown as { cacheName?: string }).cacheName as string | undefined;
  const isHtml = name === "pages" || name === "pages-rsc" || name === "pages-rsc-prefetch" || name === "others";
  const isApis = name === "apis";
  if (isHtml) {
    // Bust old 24h cache: rename to v2
    const freshName = name === "pages" ? "pages-v2" : name === "pages-rsc" ? "pages-rsc-v2" : name === "pages-rsc-prefetch" ? "pages-rsc-prefetch-v2" : "others-v2";
    return {
      ...entry,
      handler: new NetworkFirst({
        cacheName: freshName,
        plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 7 * 24 * 60 * 60 })],
      }),
    };
  }
  if (isApis) {
    return {
      ...entry,
      handler: new NetworkFirst({
        cacheName: "apis-v2",
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 120 })],
        networkTimeoutSeconds: 5,
      }),
    };
  }
  return entry;
});

const navigationNetworkFirst = {
  matcher: ({ request }: { request: Request }) => request.mode === "navigate",
  handler: new NetworkFirst({
    cacheName: "navigation-v3",
    plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  }),
};

const launchNavigationNetworkOnly = {
  matcher: ({ request, url }: { request: Request; url: URL }) =>
    request.mode === "navigate" &&
    ["source", "shareTitle", "shareText", "shareUrl", "protocol"].some((key) => url.searchParams.has(key)),
  handler: new NetworkOnly(),
};

const privateShareNetworkOnly = {
  matcher: ({ url }: { url: URL }) => url.pathname === "/api/pwa/share",
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [privateShareNetworkOnly, launchNavigationNetworkOnly, navigationNetworkFirst, ...runtimeCaching] as never,
  fallbacks: {
    entries: [
      {
        url: "/~offline.html",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
  precacheOptions: {
    cleanupOutdatedCaches: true,
    concurrency: 10,
  },
});

serwist.addEventListeners();

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CHECK_MODEL_UPDATES") return;
  event.waitUntil(
    checkModelUpdates()
      .then((ok) => event.ports[0]?.postMessage({ ok }))
      .catch(() => event.ports[0]?.postMessage({ ok: false })),
  );
});

type PeriodicSyncEvent = ExtendableEvent & { tag: string };
(self as unknown as {
  addEventListener: (type: "periodicsync", listener: (event: PeriodicSyncEvent) => void) => void;
}).addEventListener("periodicsync", (event) => {
  if (event.tag === MODEL_SYNC_TAG) event.waitUntil(checkModelUpdates());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url ?? "/hub", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin)) as WindowClient | undefined;
      if (existing) {
        await existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
