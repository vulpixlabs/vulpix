<p align="center">
  <a href="https://vulpix.vercel.app" aria-label="Open Vulpix">
    <img src="./public/vulpix-logo.png" width="152" alt="Vulpix logo" />
  </a>
</p>

<h1 align="center">Vulpix</h1>

<p align="center">
  <strong>The intelligent gateway to AI metadata.</strong><br />
  Search the live frontier, inspect model and dataset metadata, chat via BYOK playground, and compare models in one installable web app.
</p>

<p align="center">
  <a href="https://vulpix.vercel.app"><img alt="Vercel build status" src="https://img.shields.io/website?url=https%3A%2F%2Fvulpix.vercel.app&up_message=passing&down_message=failing&label=vercel%20build&logo=vercel&logoColor=white&style=for-the-badge" /></a>
  <img alt="Private" src="https://img.shields.io/badge/repo-private-000000?logo=github&logoColor=white&style=for-the-badge" />
  <img alt="License: Unlicensed" src="https://img.shields.io/badge/license-unlicensed-ef4444?style=for-the-badge" />
  <a href="https://nextjs.org"><img alt="Next.js 16.3.2" src="https://img.shields.io/badge/Next.js-16.3.2-000000?logo=nextdotjs&logoColor=white&style=for-the-badge" /></a>
  <a href="https://www.pwabuilder.com/reportcard?site=https://vulpix.vercel.app"><img alt="PWA Builder ready" src="https://img.shields.io/badge/PWA%20Builder-ready-5A0FC8?logo=pwa&logoColor=white&style=for-the-badge" /></a>
  <img alt="TypeScript 100%" src="https://img.shields.io/badge/TypeScript%20coverage-100%25-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
  <img alt="Playwright QA" src="https://img.shields.io/badge/QA-Playwright-2EAD33?logo=playwright&logoColor=white&style=for-the-badge" />
  <img alt="Node 22.x" src="https://img.shields.io/badge/Node-22.x-339933?logo=nodedotjs&logoColor=white&style=for-the-badge" />
</p>

> [!IMPORTANT]
> Proyek ini **private & unlicensed**. Tidak ada hak penggunaan, modifikasi, atau distribusi sampai lisensi resmi ditambahkan. Repo `vulpixlabs/vulpix` berstatus **Private** — hanya member organisasi dengan akses yang dapat clone.

## Tentang Vulpix

Aggregator metadata AI berbasis **Next.js App Router**. Menggabungkan metadata Hugging Face + OpenRouter, menyajikan pencarian model/dataset, arena benchmark, dan playground BYOK. Tanpa database relasional — upstream adalah source of truth, Redis sebagai cache/lock/rate-limit, IndexedDB untuk playground (client-only).

- **Live metadata, cache-aware** — cron jam-an, cache lama dipertahankan saat upstream gagal.
- **No physical app DB** — tidak ada migration/ORM; hapus Redis = rebuild dari upstream.
- **Privacy by default** — API key playground hanya di IndexedDB, diteruskan ke provider yang dipilih.
- **PWA installable** — manifest, Serwist SW (Turbopack), precache 386 entri, runtime `pages-v2` 5m + `apis-v2` 120s.
- **Security hardened** — CSP (dev `unsafe-eval` conditional), `XFO SAMEORIGIN`, `XCTO nosniff`, SSRF guard, rate-limit Redis, distributed lock, timingSafeEqual cron.

## Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js `16.3.2`, App Router, Turbopack, React `19.2.8` |
| Bahasa | TypeScript strict |
| Styling | Tailwind CSS v4, Radix UI, shadcn |
| Motion | GSAP, ScrollTrigger, Motion |
| AI | AI SDK v7, OpenAI/Anthropic/Google + OpenAI-compatible |
| Cache | Redis `ioredis` |
| Client storage | IndexedDB `idb` |
| PWA | Serwist + Turbopack |
| QA | ESLint, TypeScript, Playwright 1.62 |

## Quick Start (localhost)

```bash
git clone https://github.com/vulpixlabs/vulpix.git
cd vulpix
npm ci
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
# isi .env.local, lalu:
npm run dev
# http://localhost:3000
```

Bootstrap cache (butuh Redis + token):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/sync?force=all"
```

## Environment Variables

| Variable | Wajib | Scope | Keterangan |
|---|:---:|---|---|
| `REDIS_URL` | Ya | Server | `rediss://default:…@host:port` (ioredis, bukan REST) |
| `CRON_SECRET` | Ya | Server | Acak 32+ char |
| `HF_TOKEN` | Rekom | Server | Hugging Face read token |
| `OPENROUTER_API_KEY` | Rekom | Server | OpenRouter sync |
| `NEXT_PUBLIC_SITE_URL` | Ya prod | Public | `https://vulpix.vercel.app` tanpa slash akhir |

Hanya `NEXT_PUBLIC_` yang terekspos ke client. Jangan commit `.env.local`.

## Perintah

| Command | Fungsi |
|---|---|
| `npm run dev` | Dev server Turbopack |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |
| `npm run build` | Production build + SW precache |
| `npm run start` | Jalankan build |
| `npm run test:e2e` | Playwright E2E (Chromium + WebKit + Mobile) |
| `npx playwright test --ui` | UI mode |

Quality gate sebelum push:

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

## Arsitektur

```mermaid
flowchart LR
    U[Browser / PWA] --> N[Next.js App Router]
    N --> RH[Route Handlers]
    RH --> RL[Rate limit + lock]
    RH --> R[(Vercel Redis)]
    RH --> HF[Hugging Face APIs]
    RH --> OR[OpenRouter APIs]
    VC[Vercel Cron hourly] --> CR[/api/cron/sync]
    CR --> HF
    CR --> OR
    CR --> R
    U --> IDB[(IndexedDB local)]
    R -. miss .-> HF
    R -. miss .-> OR
```

Redis **bukan** system of record. Hapus cache = rebuild via cron/live fallback. Playground di IndexedDB milik device.

Key Redis: `models:huggingface:data:6h`, `models:openrouter:data:1h`, `models:all:combined:1-2h`, `models:openrouter:benchmarks:6h`, `models:openrouter:activity:6h`, `models:providers:<slug>:1h`.

## API Ringkas

| Method | Endpoint | Fungsi |
|---|:---|---|
| `GET` | `/api/models?q=&limit=&offset=` | Gabungan Redis/HF/OR (`source: redis-combined/recombined/live-fallback`) |
| `GET` | `/api/hf/models, /api/hf/datasets` | Proxy HF list |
| `GET` | `/api/hf/models/[id], /api/hf/datasets/[id]` | Detail |
| `GET` | `/api/arena/benchmarks, /api/arena/activity?slugs=, /api/arena/providers?slug=` | Benchmarks AA/DA, activity 30d, providers |
| `GET` | `/api/brand/[brand]?color=` | Logo same-origin (SimpleIcons→SVGL→favicon) |
| `GET` | `/api/cron/sync?force=all` | Cron Bearer `CRON_SECRET` timingSafeEqual |
| `POST` | `/api/playground/chat, /api/playground/test` | BYOK streaming, SSRF guard, body 256KB |

## Deploy ke GitHub Organization Private (manual)

Repo: **`https://github.com/vulpixlabs/vulpix`** — **Private**.

```bash
# 1. Push repo existing
git remote remove origin 2>$null
git remote add origin https://github.com/vulpixlabs/vulpix.git
git branch -M main
git push -u origin main
```

**Access control:** GitHub → `vulpixlabs` Organization → `People → Invite` → buat Teams `core` (Admin), `dev` (Write), `qa` (Triage) → `Settings → Manage access → Add team`. `Settings → Branches → Add rule → main → Require PR, Require status checks (QA), Dismiss stale`.

**Visibilitas:** `Settings → General → Danger Zone → Change visibility → Private` (sudah).

**Secrets (manual, aman):** Organization → `Settings → Secrets and variables → Actions → New organization secret` → `REDIS_URL`, `CRON_SECRET`, `HF_TOKEN`, `OPENROUTER_API_KEY` → `Selected repositories: vulpix`. Jangan commit `.env`.

## Deploy ke Vercel (manual, privat)

1. `vercel.com → Add New → Project → Import vulpixlabs/vulpix` → Framework `Next.js`, `npm ci` / `npm run build`, Node `22.x`.
2. `Storage → Marketplace → Redis` → Create DB dekat Functions → connect ke `vulpix` (inject `REDIS_URL`).
3. `Settings → Environment Variables` → tambah `REDIS_URL` (rediss://), `CRON_SECRET` (32+), `HF_TOKEN`, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_SITE_URL=https://vulpix.vercel.app` → `Sensitive` ON → `Production + Preview` → **Redeploy**.
4. Verifikasi Cron: `Settings → Cron Jobs` → `/api/cron/sync` hourly → `curl -H "Authorization: Bearer $CRON_SECRET" https://vulpix.vercel.app/api/cron/sync?force=all` → `{ok:true, combined:>0}`.
5. Smoke: `curl https://vulpix.vercel.app/api/models?limit=3` → `source redis-combined`, `curl https://vulpix.vercel.app/api/brand/openai?color=000000` → `200 image/*`.

## QA Otomatis — Playwright

Tests di `tests/e2e/` (Chromium + WebKit + Mobile Pixel 7 / iPhone 14):

- `cron.spec.ts` — `401` tanpa/wrong `CRON_SECRET`, `200/503` dengan benar (timingSafeEqual), `Retry-After` saat lock.
- `models.spec.ts` — `200` `s-maxage=60` `source redis-*`, pagination `limit/offset`, filter `q`, performa `<1.2s`.
- `pwa.spec.ts` — `manifest.webmanifest` valid (`standalone`, 4 icons), SW `/serwist/sw.js` precache >0, icons `immutable`, `~offline` → `404` → `Lost in the frontier`.

Lokal:

```bash
npm run test:e2e          # headless
npx playwright test --ui  # UI
npx playwright test --headed
npx playwright show-report
```

CI: `.github/workflows/qa.yml` — `push/PR main` → `setup-node 22, npm ci, lint, tsc, build, playwright install --with-deps chromium webkit, test:e2e` dengan `secrets.CRON_SECRET/REDIS_URL` dari org. Artefak `playwright-report` 7 hari.

## Keamanan & PWA

CSP `script-src 'self' 'unsafe-inline' (+ 'unsafe-eval' dev only)`, `XFO SAMEORIGIN`, `XCTO nosniff`, rate-limit `ioredis` + in-memory fallback, `acquireLock NX 60s`, `budgetSpend`, SSRF `assertPublicHttpsUrl` + DNS private-range block. PWA `manifest.ts` + `sw.ts` (`pages-v2` 5m, `apis-v2` 120s, `cleanupOutdatedCaches:true`).

---

<p align="center">
  <strong>Vulpix</strong> · Next.js · Redis · PWA · Private Org
</p>
