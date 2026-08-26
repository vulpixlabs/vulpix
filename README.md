<p align="center">
  <a href="https://vulpix.vercel.app" aria-label="Open Vulpix">
    <img src="./public/vulpix-logo.png" width="152" alt="Vulpix logo" />
  </a>
</p>

<h1 align="center">Vulpix</h1>

<p align="center">
  <strong>The intelligent gateway to AI metadata.</strong><br />
  Search the live frontier, inspect model and dataset metadata, chat through a BYOK playground, and compare models in one installable web app.
</p>

<p align="center">
  <a href="https://vulpix.vercel.app"><img alt="Vercel build status" src="https://img.shields.io/website?url=https%3A%2F%2Fvulpix.vercel.app&up_message=passing&down_message=failing&label=vercel%20build&logo=vercel&logoColor=white&style=for-the-badge" /></a>
  <img alt="License: Unlicensed" src="https://img.shields.io/badge/license-unlicensed-ef4444?style=for-the-badge" />
  <a href="https://nextjs.org"><img alt="Next.js 16.3.2" src="https://img.shields.io/badge/Next.js-16.3.2-000000?logo=nextdotjs&logoColor=white&style=for-the-badge" /></a>
  <a href="https://www.pwabuilder.com/reportcard?site=https://vulpix.vercel.app"><img alt="PWA Builder ready" src="https://img.shields.io/badge/PWA%20Builder-ready-5A0FC8?logo=pwa&logoColor=white&style=for-the-badge" /></a>
  <img alt="TypeScript source coverage: 100%" src="https://img.shields.io/badge/TypeScript%20coverage-100%25-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
</p>

> [!IMPORTANT]
> Proyek ini belum menerbitkan lisensi open-source. Badge **Unlicensed** bersifat sengaja: tidak ada hak penggunaan, modifikasi, atau distribusi yang diberikan sampai pemilik proyek menambahkan berkas lisensi.

## 🧭 Daftar isi

- [Tentang Vulpix](#-tentang-vulpix)
- [Fitur utama](#-fitur-utama)
- [Arsitektur sistem](#-arsitektur-sistem)
- [Stack teknologi](#-stack-teknologi)
- [Instalasi lokal](#-instalasi-lokal)
- [Environment variables](#-environment-variables)
- [Perintah proyek](#-perintah-proyek)
- [Struktur berkas](#-struktur-berkas)
- [Dokumentasi API](#-dokumentasi-api)
- [Cron dan siklus sinkronisasi](#-cron-dan-siklus-sinkronisasi)
- [PWA dan cache browser](#-pwa-dan-cache-browser)
- [Keamanan dan ketahanan logo](#-keamanan-dan-ketahanan-logo)
- [Deployment ke Vercel](#-deployment-ke-vercel)
- [Pembersihan repositori](#-pembersihan-repositori)
- [Aturan `.gitignore`](#-aturan-gitignore)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi dan lisensi](#-kontribusi-dan-lisensi)

## 🦊 Tentang Vulpix

Vulpix adalah website aggregator metadata AI berbasis **Next.js App Router**. Aplikasi menggabungkan metadata model dari Hugging Face dan OpenRouter, menyajikan pencarian model/dataset, menyediakan arena perbandingan benchmark, serta playground AI dengan pendekatan **bring your own key** (BYOK).

Vulpix tidak memakai database relasional atau database fisik milik aplikasi. Upstream tetap menjadi sumber kebenaran; Redis dipakai sebagai cache terdistribusi, koordinasi rate limit, lock sinkronisasi, dan penyimpanan snapshot sementara. Riwayat chat, proyek, pengaturan, serta artefak playground disimpan di IndexedDB pada browser pengguna dan tidak dikirim ke database aplikasi.

### Prinsip desain

- **Live metadata, cache-aware** — data segar diambil terjadwal, cache lama dipertahankan saat upstream gagal.
- **No physical app database** — tidak ada schema, migration, ORM, atau server database persisten.
- **Privacy by default** — API key playground disimpan lokal dan hanya diteruskan ke provider yang dipilih.
- **Progressive Web App** — manifest, service worker, offline route, shortcut, icon maskable, dan screenshot tersedia.
- **Resilient UI** — logo asli diprioritaskan melalui proxy same-origin; fallback monogram lokal mencegah slot gambar kosong.
- **Security hardened** — CSP, security headers, SSRF guard, body limit, rate limit Redis, distributed lock, dan generic error responses.

## ✨ Fitur utama

| Area | Kemampuan |
|---|---|
| Landing | Search command, live Hub preview, model-lab marquee, arsitektur visual, pricing, FAQ, dan PWA install flow |
| Model Hub | Pencarian, filter task/library/license/language, pagination, metadata, README summary, file tree, dan usage snippets |
| Dataset Hub | Pencarian dataset, metadata, README summary, tree file, serta viewer rows dengan offset/length tervalidasi |
| Arena | Perbandingan 2–4 model, pricing, context, modality, benchmark, Design Arena, aktivitas, provider, dan quantization |
| Playground | Multi-provider BYOK, streaming chat, Markdown + Shiki, projects, artifacts, skills, settings, dan custom endpoint HTTPS |
| PWA | Installable manifest, offline page, runtime caching, navigation network-only, icons, screenshots, dan shortcuts |
| Operations | Vercel Cron, Redis cache, upstream fallback, rate limiting, locks, sync budget, dan cache diagnostics |

### Halaman aplikasi

| Route | Fungsi |
|---|---|
| `/` | Landing utama dan global search |
| `/hub` | Model index |
| `/hub?view=datasets` | Dataset index |
| `/hub/model/[id]` | Detail model Hugging Face |
| `/hub/datasets/[id]` | Detail dan viewer dataset |
| `/arena` | Perbandingan model dan benchmark |
| `/playground` | BYOK AI playground |
| `/~offline` | Fallback saat navigasi offline |

## 🏗️ Arsitektur sistem

```mermaid
flowchart LR
    U[Browser / PWA] --> N[Next.js App Router]
    N --> RH[Route Handlers]
    RH --> RL[Rate limit + lock]
    RH --> R[(Vercel Redis cache)]
    RH --> HF[Hugging Face APIs]
    RH --> OR[OpenRouter APIs]
    VC[Vercel Cron hourly] --> CR[/api/cron/sync]
    CR --> HF
    CR --> OR
    CR --> R
    U --> IDB[(IndexedDB, local-only)]
    R -. cache miss .-> HF
    R -. cache miss .-> OR
```

### Mengapa disebut “tanpa database fisik”

Redis di sini bukan system of record. Tidak ada entitas bisnis yang hanya hidup di Redis, tidak ada migration, dan tidak ada foreign key. Jika seluruh cache dihapus, cron atau request fallback dapat membangun ulang data dari upstream. Pengecualiannya adalah data lokal playground di IndexedDB, yang memang dimiliki perangkat/browser pengguna.

### Alur data metadata

1. Vercel memanggil `GET /api/cron/sync` setiap jam.
2. Route memverifikasi `Authorization: Bearer <CRON_SECRET>` menggunakan perbandingan timing-safe.
3. Timestamp Redis menentukan sumber mana yang perlu disinkronkan: OpenRouter tiap 1 jam; Hugging Face, benchmark, dan activity tiap 6 jam.
4. Metadata dinormalisasi dan digabung berdasarkan model ID.
5. `GET /api/models` mencoba `redis-combined`, lalu membangun ulang dari cache sumber, lalu melakukan live fetch sebagai fallback terakhir.
6. Cache lama tidak dihapus ketika upstream gagal, sehingga gangguan eksternal tidak otomatis mengosongkan UI.

### Key Redis utama

| Key | Isi | TTL |
|---|---|---:|
| `models:huggingface:data` | Snapshot metadata Hugging Face | 6 jam |
| `models:openrouter:data` | Model, pricing, context, modality | 1 jam |
| `models:all:combined` | Hasil gabungan untuk API publik | 1–2 jam |
| `models:openrouter:benchmarks` | Artificial Analysis + Design Arena | 6 jam |
| `models:openrouter:activity` | Aktivitas token harian | 6 jam |
| `models:providers:<slug>` | Endpoint/provider model | 1 jam |
| `rl:*`, `budget:*`, `*:lock:*` | Rate limit, budget, dan distributed lock | Sesuai window |

## 🧰 Stack teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js `16.3.2`, App Router, Route Handlers, React `19.2.8` |
| Bahasa | TypeScript strict |
| Styling | Tailwind CSS v4, Radix UI, shadcn-compatible primitives |
| Motion | GSAP, ScrollTrigger, Motion |
| AI | AI SDK v7, OpenAI, Anthropic, Google, dan OpenAI-compatible providers |
| Cache | Redis melalui `ioredis` |
| Client storage | IndexedDB melalui `idb` |
| PWA | Serwist + Turbopack |
| Markdown/code | `react-markdown`, `remark-gfm`, Shiki |
| QA | ESLint, TypeScript, Playwright, production build |
| Hosting | Vercel Functions, Vercel Cron, Marketplace Storage |

Badge TypeScript **100%** berarti seluruh source executable di `src/` memakai `.ts`/`.tsx`; ini bukan statement branch/test coverage.

## 🚀 Instalasi lokal

### Prasyarat

- Node.js `22.x`
- npm (lockfile resmi proyek: `package-lock.json`)
- Redis dengan URL TCP/TLS yang dapat diakses dari runtime
- Token Hugging Face dan OpenRouter sangat disarankan agar tidak cepat terkena upstream rate limit

### Quick start

```bash
git clone <repository-url>
cd Vulpix
npm ci
```

Salin konfigurasi contoh:

```bash
cp .env.example .env.local
```

PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Isi `.env.local`, lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000`. Jangan menaruh `.env.local` di dalam `src/`; Next.js membaca berkas environment dari root proyek.

### Bootstrap cache lokal

Setelah server dan Redis aktif:

```bash
curl -H "Authorization: Bearer local-dev-secret" \
  "http://localhost:3000/api/cron/sync?force=all"
```

Tanpa `REDIS_URL`, module Redis memang gagal diinisialisasi. Tanpa cache awal, beberapa route akan mencoba live fallback dan dapat terasa lebih lambat.

## 🔐 Environment variables

| Variable | Wajib | Scope | Keterangan |
|---|:---:|---|---|
| `REDIS_URL` | Ya | Server | URL Redis TCP/TLS untuk `ioredis`, misalnya `rediss://default:…@host:port` |
| `CRON_SECRET` | Ya | Server | Secret acak minimal 16 karakter; 32+ karakter direkomendasikan |
| `HF_TOKEN` | Direkomendasikan | Server | Read token Hugging Face untuk kuota dan stabilitas sinkronisasi |
| `OPENROUTER_API_KEY` | Direkomendasikan | Server | Sinkronisasi model, benchmark, activity, dan endpoint provider |
| `NEXT_PUBLIC_SITE_URL` | Ya saat deploy | Public/build | URL origin final tanpa trailing slash, misalnya `https://vulpix.vercel.app` |

Contoh tersedia di [`.env.example`](./.env.example). Hanya variabel dengan prefix `NEXT_PUBLIC_` yang boleh diekspos ke client bundle.

## ⌨️ Perintah proyek

| Command | Fungsi |
|---|---|
| `npm run dev` | Menjalankan development server Turbopack |
| `npm run lint` | Menjalankan ESLint ke seluruh proyek |
| `npx tsc --noEmit` | Type-check tanpa menghasilkan output |
| `npm run build` | Membuat production build dan service worker |
| `npm run start` | Menjalankan hasil production build |

Quality gate minimum sebelum push:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## 🗂️ Struktur berkas

```text
Vulpix/
├── docs/
│   ├── deployment.md                 # Runbook deployment dan smoke test
│   ├── plan.md                       # Riwayat implementasi/audit
│   └── legacy/
│       └── maventhub-prd.md          # PRD historis sebelum rename Vulpix
├── public/
│   ├── brands/                      # Curated original logos for landing/marquee
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── icon-maskable-192.png
│   │   └── icon-maskable-512.png
│   ├── screenshots/
│   │   ├── narrow.png                # PWA screenshot, manifest-referenced
│   │   └── wide.png                  # PWA screenshot, manifest-referenced
│   ├── apple-touch-icon.png
│   └── vulpix-logo.png               # Logo utama aplikasi/README
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── arena/
│   │   │   │   ├── activity/route.ts
│   │   │   │   ├── benchmarks/route.ts
│   │   │   │   └── providers/route.ts
│   │   │   ├── brand/[brand]/route.ts
│   │   │   ├── cron/sync/route.ts
│   │   │   ├── hf/
│   │   │   │   ├── avatar/[author]/route.ts
│   │   │   │   ├── dataset-viewer/route.ts
│   │   │   │   ├── datasets/[id]/route.ts
│   │   │   │   ├── datasets/route.ts
│   │   │   │   ├── models/[id]/route.ts
│   │   │   │   ├── models/route.ts
│   │   │   │   └── readme/route.ts
│   │   │   ├── models/route.ts
│   │   │   └── playground/
│   │   │       ├── chat/route.ts
│   │   │       ├── models/route.ts
│   │   │       └── test/route.ts
│   │   ├── arena/page.tsx
│   │   ├── hub/
│   │   │   ├── datasets/[id]/page.tsx
│   │   │   ├── datasets/page.tsx
│   │   │   ├── model/[id]/page.tsx
│   │   │   └── page.tsx
│   │   ├── playground/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── serwist/sw.js/route.ts
│   │   ├── ~offline/page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── manifest.ts
│   │   ├── not-found.tsx
│   │   ├── page.tsx
│   │   └── sw.ts
│   ├── components/
│   │   ├── arena/                     # Picker, chart, provider, dan tables
│   │   ├── hub/                       # Cards, search, actions, dataset viewer
│   │   ├── magicui/                   # Animated beam primitive
│   │   ├── playground/                # Chat, composer, sidebar, artifacts, settings
│   │   ├── sections/                  # Landing sections
│   │   ├── ui/                        # Reusable UI primitives + LogoMark
│   │   ├── not-found-client.tsx
│   │   ├── preloader.tsx
│   │   ├── pwa.tsx
│   │   ├── site-navbar.tsx
│   │   └── trail-canvas.tsx
│   └── lib/
│       ├── playground/                # IndexedDB, provider registry, state, skills
│       ├── arena-format.ts
│       ├── brand-logos.ts
│       ├── gsap.ts
│       ├── hf.ts
│       ├── logo-fallback.ts
│       ├── rate-limit.ts
│       ├── redis.ts
│       ├── reveal.ts
│       ├── ssrf.ts
│       ├── sync.ts
│       ├── trail-heat.ts
│       └── utils.ts
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vercel.json
```

## 🔌 Dokumentasi API

Semua endpoint menggunakan JSON kecuali endpoint logo/avatar yang mengembalikan image response. Route publik tetap dilindungi rate limit dan cache headers.

### Metadata publik

| Method | Endpoint | Input utama | Ringkasan |
|---|---|---|---|
| `GET` | `/api/models` | `q`, `limit=1..1000`, `offset>=0` | Model gabungan Redis/HF/OpenRouter |
| `GET` | `/api/hf/models` | `q`, `task`, `lib`, `license`, `language`, `sort`, `limit`, `skip` | Proxy daftar model Hugging Face |
| `GET` | `/api/hf/models/[id]` | encoded model ID | Detail model |
| `GET` | `/api/hf/datasets` | `q`, `task`, `language`, `sort`, `limit`, `skip` | Proxy daftar dataset |
| `GET` | `/api/hf/datasets/[id]` | encoded dataset ID | Detail dataset |
| `GET` | `/api/hf/readme` | `id`, `kind=model\|dataset` | Ringkasan README/card metadata |
| `GET` | `/api/hf/dataset-viewer` | `dataset`, `config`, `split`, `offset`, `length=1..100` | Rows dari Hugging Face Dataset Server |
| `GET` | `/api/hf/avatar/[author]` | safe author slug | Avatar asli yang diproxy; fallback SVG bila tidak ada |
| `GET` | `/api/brand/[brand]` | `color=RRGGBB` | Logo asli same-origin + cached fallback chain |
| `GET` | `/api/arena/benchmarks` | optional header `x-or-key` | Artificial Analysis dan Design Arena |
| `GET` | `/api/arena/activity` | `slugs=a/b,c/d` (maks. 8) | 30 hari aktivitas model |
| `GET` | `/api/arena/providers` | `slug=provider/model` | Endpoint provider, quantization, dan weighted input price |

Contoh:

```bash
curl "http://localhost:3000/api/models?q=llama&limit=10&offset=0"
curl "http://localhost:3000/api/hf/models?task=text-generation&limit=12"
curl "http://localhost:3000/api/arena/activity?slugs=openai/gpt-5.5"
```

Respons `/api/models` menyertakan `source`:

- `redis-combined` — snapshot gabungan sudah tersedia.
- `redis-recombined` — snapshot gabungan dibuat ulang dari cache sumber.
- `live-fallback` — Redis kosong; response dibuat langsung dari upstream.

### Endpoint playground internal

Endpoint ini dipakai UI dan bukan API publik stabil.

| Method | Endpoint | Input | Catatan |
|---|---|---|---|
| `GET` | `/api/playground/models` | `provider`, optional `base`; header `x-pg-key` | Memuat model provider/BYOK |
| `POST` | `/api/playground/test` | provider config + key | Menguji koneksi; custom URL wajib HTTPS publik |
| `POST` | `/api/playground/chat` | messages, provider, model, generation settings | Streaming AI response; body maksimal 256 KB |

Custom provider dilindungi validasi SSRF: hanya HTTPS, DNS resolution diperiksa, redirect divalidasi ulang, dan private/reserved IP diblokir. Ollama/LM Studio tetap didefinisikan sebagai opsi lokal di client, tetapi endpoint server publik tidak boleh dipakai untuk menjangkau localhost.

### Status penting

| Status | Arti |
|---:|---|
| `200` | Berhasil atau fallback aman tersedia |
| `400` | Parameter tidak lengkap/tidak valid |
| `401` | Cron secret salah atau tidak ada |
| `413` | Payload playground terlalu besar |
| `429` | Rate limit terlampaui; periksa `Retry-After` |
| `502` | Upstream/proxy gagal |
| `503` | Data belum tersedia atau sinkronisasi sedang dikunci |

## ⏱️ Cron dan siklus sinkronisasi

`vercel.json` mendefinisikan satu job:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Endpoint internal cron

```http
GET /api/cron/sync?force=all
Authorization: Bearer <CRON_SECRET>
Cache-Control: no-store
```

Nilai `force` yang didukung:

| Value | Efek |
|---|---|
| kosong | Mengikuti interval timestamp masing-masing sumber |
| `hf` | Paksa metadata Hugging Face |
| `or` | Paksa model OpenRouter |
| `bench` | Paksa benchmark |
| `act` | Paksa activity |
| `all` | Paksa seluruh sumber |

Contoh response:

```json
{
  "ok": true,
  "hf": "synced",
  "or": "synced",
  "bench": "synced",
  "act": "synced",
  "combined": 505
}
```

`combined` bersifat dinamis; jangan membuat test yang mengunci angka contoh di atas.

## 📲 PWA dan cache browser

- Manifest dihasilkan oleh `src/app/manifest.ts`.
- Service worker dikompilasi Serwist melalui `src/app/sw.ts` dan route `src/app/serwist/sw.js/route.ts`.
- Navigasi memakai strategi network-only untuk mencegah flash HTML versi lama.
- API memakai network-first dengan TTL pendek; static icons memakai immutable cache header.
- PWA screenshots di `public/screenshots/` adalah bagian manifest dan **bukan** demo sampah.
- `public/icons/` dan `public/apple-touch-icon.png` dibutuhkan untuk installability.

Setelah perubahan service worker, lakukan hard refresh dan, bila perlu, hapus cache lama melalui DevTools → Application → Cache Storage.

## 🛡️ Keamanan dan ketahanan logo

### Logo dan avatar

Sumber logo sengaja berbeda per surface dan tidak diseragamkan: Hub selalu mencoba avatar organisasi/user dari Hugging Face; Arena memakai provider slug dari model OpenRouter; landing memakai katalog logo asli yang di-self-host di `public/brands`. Marquee menerapkan filter putih murni pada katalog lokal. Untuk logo Arena dan provider dinamis, browser meminta `/api/brand/[brand]`, lalu server mencoba secara berurutan:

1. SVG resmi Simple Icons dengan warna yang diminta.
2. SVG dari SVGL untuk brand yang tidak tersedia di Simple Icons.
3. Favicon domain resmi.
4. Monogram SVG deterministik jika seluruh sumber gagal.

Hasil asli diproxy sebagai same-origin dan di-cache selama tujuh hari. `LogoMark` tetap memasang fallback DOM jika image response gagal, sehingga UI tidak meninggalkan broken-image icon. Avatar Hugging Face memakai strategi serupa melalui `/api/hf/avatar/[author]`.

### Hardening API

- CSP dan security headers ditetapkan di `next.config.ts`.
- Rate limiting menggunakan Redis dengan fallback in-memory per instance.
- Live refresh memakai distributed lock dan budget per window.
- Cron authentication fail-closed dan timing-safe.
- Custom URL playground menjalani validasi SSRF serta redirect hop validation.
- Error provider tidak membocorkan respons sensitif ke client.
- Secret tidak memakai prefix `NEXT_PUBLIC_`.

## ▲ Deployment ke Vercel

### 1. Import proyek

1. Push repositori ke Git provider.
2. Di Vercel, pilih **Add New → Project** dan import repositori.
3. Framework preset: **Next.js**.
4. Install command: `npm ci`.
5. Build command: `npm run build`.
6. Pastikan Node.js mengikuti `22.x` dari `package.json`.

### 2. Hubungkan Redis melalui Storage

Dashboard Vercel terbaru menyediakan storage melalui Marketplace:

1. Buka proyek → **Storage**; jika diarahkan, buka **Marketplace → Storage**.
2. Pilih **Redis** atau provider Redis yang kompatibel.
3. Klik **Install/Create Database**, pilih plan dan region yang dekat dengan Functions.
4. Hubungkan resource ke proyek Vulpix dan environment yang diperlukan.
5. Integrasi akan menyuntikkan credentials ke Project Settings.
6. Pastikan ada URL koneksi Redis TCP/TLS dan map nilainya ke `REDIS_URL` bila nama bawaan integrasi berbeda.

> [!WARNING]
> Kode menggunakan `ioredis`; REST-only URL/token tidak cukup. Gunakan connection string `redis://` atau `rediss://`.

Referensi: [Vercel Storage](https://vercel.com/docs/storage) dan [Redis for Vercel](https://vercel.com/marketplace/redis/redis).

### 3. Isi environment variables

Buka **Settings → Environment Variables** dan tambahkan:

```text
REDIS_URL=rediss://...
CRON_SECRET=<random-secret>
HF_TOKEN=hf_...
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_SITE_URL=https://<domain-final>
```

Terapkan ke Production dan, bila diperlukan, Preview/Development. Perubahan environment variable hanya berlaku pada deployment baru, jadi lakukan redeploy. Referensi: [Vercel Environment Variables](https://vercel.com/docs/environment-variables).

### 4. Verifikasi cron

Setelah deployment:

1. Buka **Settings → Cron Jobs**.
2. Pastikan `/api/cron/sync` aktif dengan jadwal hourly.
3. Jalankan bootstrap manual menggunakan `?force=all`.
4. Vercel otomatis mengirim `CRON_SECRET` sebagai `Authorization: Bearer …` untuk job terjadwal.

Referensi: [Managing Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

### 5. Smoke test production

```bash
curl -I "https://<domain>/"
curl "https://<domain>/api/models?limit=3"
curl "https://<domain>/api/arena/benchmarks"
curl -I "https://<domain>/api/brand/openai?color=000000"
```

Lanjutkan dengan browser QA pada desktop, tablet, dan mobile: landing, Hub, Arena, Playground, install prompt, console, request gagal, horizontal overflow, serta semua logo/avatar.

Runbook ringkas tersedia di [`docs/deployment.md`](./docs/deployment.md).

## 🧹 Pembersihan repositori

Tujuan cleanup adalah menghapus artefak yang dapat dibuat ulang tanpa menyentuh asset runtime.

### Aman dihapus

- `.next/`, `out/`, `coverage/`, dan `*.tsbuildinfo`.
- `.playwright-mcp/`, screenshot QA lokal, trace, video, dan console dump.
- Screenshot debug di root seperti `pg*-final.png`, `*-verify.png`, atau hasil eksperimen lain yang tidak direferensikan kode.
- Asset bawaan starter seperti `next.svg`, `vercel.svg`, `globe.svg`, `window.svg`, dan `file.svg` jika `rg` membuktikan tidak ada referensi.
- Gambar demo/preview besar yang tidak dipakai component, CSS, metadata, manifest, test, atau dokumentasi.
- Dokumen deployment/plan duplikat di root setelah versi kanonik dipindah ke `/docs`.

### Jangan dihapus

- `public/vulpix-logo.png`.
- `public/icons/*` dan `public/apple-touch-icon.png`.
- `public/screenshots/wide.png` dan `public/screenshots/narrow.png` karena direferensikan manifest PWA.
- `src/app/favicon.ico`.
- `.env.example`, `README.md`, `AGENTS.md`, dan isi `/docs` yang di-allowlist.

### Prosedur audit sebelum hapus

```bash
# Cari referensi berdasarkan nama file
rg -n "nama-asset" src public docs README.md

# Daftar asset yang benar-benar menjadi bagian aplikasi
rg --files public src/app | sort

# Setelah cleanup
npm run lint
npx tsc --noEmit
npm run build
```

Jangan menghapus berdasarkan ukuran saja. PWA screenshot dan icon memang jarang muncul pada halaman biasa, tetapi tetap digunakan manifest/install surface.

## 🙈 Aturan `.gitignore`

Repo menerapkan blok berikut untuk secret, output framework, QA artifacts, gambar debug root, dan seluruh Markdown non-kanonik:

```gitignore
# Secrets; keep the empty contract file
.env*
!.env.example

# Framework / generated
/.next/
/out/
/build/
/coverage/
*.tsbuildinfo
next-env.d.ts
/.vercel/

# Local browser QA
/.playwright-mcp/

# Root-level debug screenshots only
/*.png

# Ignore arbitrary Markdown, then allow canonical docs
*.md
!README.md
!AGENTS.md
!CLAUDE.md
!docs/
!docs/**/*.md
```

`*.md` sengaja dipasangkan dengan allowlist. Tanpa baris `!README.md` dan `!docs/**/*.md`, dokumentasi utama yang baru dibuat ikut hilang dari Git. Asset PNG di dalam `public/` tetap dapat dilacak karena hanya `/*.png` pada root yang diabaikan.

## 🩺 Troubleshooting

### Logo asli tidak muncul

1. Buka `/api/brand/openai?color=000000`; response harus `200` dan `Content-Type: image/*`.
2. Periksa header `Content-Security-Policy`; request component semestinya same-origin.
3. Jika upstream logo gagal, endpoint tetap mengembalikan SVG monogram. Slot kosong atau broken-image icon berarti ada regresi di `LogoMark`.
4. Hapus cache browser lama jika service worker masih memegang HTML/JS versi sebelumnya.

### Hub menampilkan nol model

1. Pastikan `REDIS_URL` valid dan dapat diakses.
2. Pastikan `HF_TOKEN` tidak kedaluwarsa.
3. Panggil cron dengan `?force=hf`, lalu `?force=or` atau `?force=all`.
4. Periksa `source` pada `/api/models`; `503` berarti Redis dan live fallback sama-sama gagal.

### Arena kosong atau lambat

- Pastikan sync benchmark/activity berhasil.
- Isi `OPENROUTER_API_KEY` untuk mengurangi kegagalan upstream.
- Response `source: none` dapat terjadi saat lock/budget aktif; tunggu window berikutnya alih-alih men-spam request.

### Localhost lambat

Tanpa Redis berisi data, route dapat menunggu live fetch hingga timeout upstream. Bootstrap cache sekali melalui cron lokal. Jangan menonaktifkan timeout atau SSRF guard untuk membuat development terasa cepat.

### PWA menampilkan versi lama

- Hard refresh.
- DevTools → Application → Service Workers → update/unregister.
- Hapus Cache Storage lama.
- Pastikan build baru menghasilkan service worker dan manifest tanpa error.

## 🤝 Kontribusi dan lisensi

1. Buat branch kecil dan fokus.
2. Jangan commit token, `.env.local`, output build, screenshot debug, atau browser trace.
3. Baca `AGENTS.md` dan dokumentasi Next.js lokal di `node_modules/next/dist/docs/` sebelum mengubah API/convention framework.
4. Jalankan lint, type-check, build, dan browser QA proporsional terhadap perubahan.
5. Dokumentasikan keputusan arsitektur dan perubahan API di `/docs`.

Saat ini proyek bersifat **unlicensed/private source**. Tambahkan lisensi eksplisit sebelum menerima distribusi atau kontribusi publik.

---

<p align="center">
  Built for an open intelligence frontier.<br />
  <strong>Vulpix</strong> · Next.js · Redis · PWA
</p>
