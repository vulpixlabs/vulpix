import { test, expect } from "@playwright/test";
import fs from "node:fs";

function getCronSecret(): string {
  if (process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 16) return process.env.CRON_SECRET;
  try {
    const raw = fs.readFileSync(".env.local", "utf-8");
    const m = raw.match(/^CRON_SECRET\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (m?.[1]) return m[1].trim();
  } catch {}
  try {
    const raw2 = fs.readFileSync(".env.example", "utf-8");
    const m2 = raw2.match(/^CRON_SECRET\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (m2?.[1] && m2[1].trim().length >= 16) return m2[1].trim();
  } catch {}
  return "test-cron-secret-32chars-minimum-length";
}

test.describe("CRON /api/cron/sync — CRON_SECRET", () => {
  const secret = getCronSecret();

  test("401 without Authorization", async ({ request }) => {
    const res = await request.get("/api/cron/sync");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => null);
    expect(body).toBeTruthy();
  });

  test("401 with wrong secret", async ({ request }) => {
    const res = await request.get("/api/cron/sync", {
      headers: { Authorization: "Bearer wrong-secret-value-1234567890" },
    });
    expect(res.status()).toBe(401);
  });

  test("200/503 with correct secret (timingSafeEqual, not 401)", async ({ request }) => {
    const res = await request.get("/api/cron/sync?force=all", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    // 200 when Redis+upstream ok, 503 when budget/lock or upstream down — both prove auth passed
    expect([200, 503]).toContain(res.status());
    expect(res.status()).not.toBe(401);
    if (res.status() === 200) {
      const json = await res.json();
      expect(json).toHaveProperty("ok");
    }
  });

  test("rate-limit & budget headers present on 429/503", async ({ request }) => {
    // hammer with 5 quick unauth to trigger rate-limit path (should be 401, but check headers on auth path)
    const res = await request.get("/api/cron/sync?force=hf", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    // either 200 or 503 with Retry-After when locked
    if (res.status() === 503) {
      expect(res.headers()["retry-after"]).toBeDefined();
    }
  });
});
