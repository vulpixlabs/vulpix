# Vulpix deployment runbook

Dokumen ini adalah checklist operasional ringkas. Penjelasan arsitektur, API, dan konfigurasi lengkap tersedia di [`README.md`](../README.md).

## Prasyarat

- Proyek sudah terhubung ke Vercel.
- Runtime Node.js mengikuti `package.json` (`22.x`).
- Redis Cloud/Redis Marketplace terhubung ke proyek dan menyediakan URL TCP/TLS pada `REDIS_URL`.
- `CRON_SECRET`, `HF_TOKEN`, `OPENROUTER_API_KEY`, dan `NEXT_PUBLIC_SITE_URL` sudah diatur untuk Production; terapkan juga ke Preview bila preview harus berfungsi penuh.

## Sebelum deploy

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

## Konfigurasi Vercel

1. Import repositori sebagai proyek Next.js.
2. Buka **Storage** atau **Marketplace**, pilih integrasi Redis, buat resource, lalu hubungkan ke proyek.
3. Pastikan kredensial integrasi menghasilkan `REDIS_URL`. Vulpix menggunakan `ioredis`, sehingga URL harus berupa koneksi Redis TCP/TLS, bukan hanya REST URL.
4. Buka **Settings → Environment Variables** dan isi semua variabel yang tercantum di `.env.example`.
5. Deploy ulang setelah mengubah environment variable.
6. Pastikan **Settings → Cron Jobs** menampilkan `/api/cron/sync` dengan jadwal `0 * * * *`.

## Bootstrap cache

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://vulpix.vercel.app/api/cron/sync?force=all"
```

Respons sehat mengandung `ok`, status `hf`/`or`/`bench`/`act`, dan jumlah `combined` lebih dari nol.

## Smoke test

```bash
curl "https://vulpix.vercel.app/api/models?limit=3"
curl "https://vulpix.vercel.app/api/arena/benchmarks"
curl -I "https://vulpix.vercel.app/api/brand/openai?color=000000"
```

Periksa juga `/`, `/hub`, `/arena`, `/playground`, manifest PWA, service worker, console browser, dan tidak adanya gambar dengan `naturalWidth === 0`.

## Rollback

Gunakan **Deployments → deployment terakhir yang sehat → Promote to Production**. Jangan menghapus key Redis saat rollback; cache lama sengaja dipertahankan sebagai fallback ketika upstream gagal.
