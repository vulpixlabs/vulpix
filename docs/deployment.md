# Vulpix deployment runbook

Dokumen ini adalah checklist operasional ringkas. Penjelasan arsitektur, API, dan konfigurasi lengkap tersedia di [`README.md`](../README.md).

## Prasyarat

- Proyek sudah terhubung ke Vercel.
- Runtime Node.js mengikuti `package.json` (`22.x`).
- Upstash Redis REST DB (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) dari console.upstash.com — **langsung, bukan via Vercel Marketplace** (Free 30 MB marketplace disabled jika sudah ada 1 DB).
- `CRON_SECRET`, `HF_TOKEN`, `OPENROUTER_API_KEY`, dan `NEXT_PUBLIC_SITE_URL` sudah diatur untuk Production; terapkan juga ke Preview bila preview harus berfungsi penuh.

## Sebelum deploy

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

## Konfigurasi Vercel (manual, tanpa Marketplace)

1. Import repositori sebagai proyek Next.js.
2. **Jangan** pakai Marketplace `Free — 30 MB` (greyed jika sudah ada 1 DB per akun — lihat `sure-oyster-205398` di Upstash Console). Buat DB langsung di `console.upstash.com` → Copy `UPSTASH_REDIS_REST_URL` (`https://...upstash.io`) + `UPSTASH_REDIS_REST_TOKEN`.
3. `Settings → Environment Variables` → Tambah `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`, `HF_TOKEN`, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_SITE_URL` → `Sensitive` ON, `Production + Preview` → Save.
4. Deploy ulang setelah mengubah env.
5. Pastikan **Settings → Cron Jobs** menampilkan backup `/api/cron/sync` `0 2 * * *`.

## Konfigurasi GitHub Actions

1. Tambahkan `CRON_SECRET` yang sama ke **Settings → Secrets and variables → Actions**.
2. Pastikan workflow `Sync metadata` aktif pada branch default.
3. Workflow `.github/workflows/sync.yml` memanggil endpoint produksi setiap empat jam (`0 */4 * * *`, UTC). Vercel Cron tetap menjadi backup harian untuk akun Hobby.

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
