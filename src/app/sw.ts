/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Keep static assets cache, but make documents & APIs fresh.
// Default Serwist caches html/rsc/pages for 24h (NetworkFirst timeout 10s) which causes
// "old version flash" on landing/hub. Override to network-first with very short TTL
// so user always sees live HTML, matching "Data streams live" promise.
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
        plugins: [new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 5 * 60 })],
        networkTimeoutSeconds: 3,
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

// Ensure navigation document itself is network-only when online: fixes stale HTML flash.
// This matcher runs before the html NetworkFirst above, forcing fresh doc if reachable.
const navigationNetworkOnly = {
  matcher: ({ request }: { request: Request }) => request.mode === "navigate",
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [navigationNetworkOnly, ...runtimeCaching] as never,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    concurrency: 10,
  },
});

serwist.addEventListeners();
