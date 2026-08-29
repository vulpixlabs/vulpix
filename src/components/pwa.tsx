"use client";

import { useEffect, type ReactNode } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import { getSettings, updateSettings } from "@/lib/playground/db";

const MODEL_CHECK_INTERVAL = 6 * 60 * 60 * 1_000;
const MODEL_CHECK_POLL_INTERVAL = 15 * 60 * 1_000;

async function checkModelUpdates(registration: ServiceWorkerRegistration) {
  const worker = registration.active;
  if (!worker) return false;

  return new Promise<boolean>((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve(false), 30_000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      resolve(event.data?.ok === true);
    };
    worker.postMessage({ type: "CHECK_MODEL_UPDATES" }, [channel.port2]);
  });
}

export function PWA({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let checking = false;
    let lastAttemptAt = 0;
    const maybeCheck = async () => {
      if (cancelled || checking) return;
      checking = true;
      try {
        const settings = await getSettings();
        const lastCheck = Math.max(settings.modelNotificationsCheckedAt ?? 0, lastAttemptAt);
        if (
          cancelled ||
          !settings.modelNotifications ||
          !("Notification" in window) ||
          Notification.permission !== "granted" ||
          Date.now() - lastCheck < MODEL_CHECK_INTERVAL
        ) {
          return;
        }
        lastAttemptAt = Date.now();
        const registration = await navigator.serviceWorker.ready;
        if (await checkModelUpdates(registration)) {
          await updateSettings({ modelNotificationsCheckedAt: Date.now() });
        }
      } finally {
        checking = false;
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void maybeCheck();
    };
    void maybeCheck();
    const interval = window.setInterval(() => void maybeCheck(), MODEL_CHECK_POLL_INTERVAL);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js" reloadOnOnline>
      {children}
    </SerwistProvider>
  );
}
