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
npm run typecheck
npm run build
```

## Konfigurasi Vercel (manual, tanpa Marketplace)

1. Import repositori sebagai proyek Next.js.
2. **Jangan** pakai Marketplace `Free — 30 MB` (greyed jika sudah ada 1 DB per akun — lihat `sure-oyster-205398` di Upstash Console). Buat DB langsung di `console.upstash.com` → Copy `UPSTASH_REDIS_REST_URL` (`https://...upstash.io`) + `UPSTASH_REDIS_REST_TOKEN`.
3. `Settings → Environment Variables` → Tambah `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`, `HF_TOKEN`, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_SITE_URL` → `Sensitive` ON, `Production + Preview` → Save.
4. Deploy ulang setelah mengubah env.
5. Pastikan **Settings → Cron Jobs** menampilkan `/api/cron/sync` `0 2 * * *`.

## Bootstrap cache

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://vulpixlabs.vercel.app/api/cron/sync?force=all"
```

Respons sehat mengandung `ok`, status `hf`/`or`/`bench`/`act`, dan jumlah `combined` lebih dari nol.

## Smoke test

```bash
curl "https://vulpixlabs.vercel.app/api/models?limit=3"
curl "https://vulpixlabs.vercel.app/api/arena/benchmarks"
curl -I "https://vulpixlabs.vercel.app/api/brand/openai?color=000000"
```

Periksa juga `/`, `/hub`, `/arena`, `/playground`, manifest PWA, service worker, console browser, dan tidak adanya gambar dengan `naturalWidth === 0`.

## APK tanpa address bar

PWA web memakai `display: standalone`, sehingga instalasi dari browser tidak menampilkan address bar. APK PWABuilder/TWA juga memerlukan Digital Asset Links agar tidak turun ke Custom Tab yang menampilkan domain.

1. Gunakan application ID `app.vercel.vulpixlabs.twa` dan origin `https://vulpixlabs.vercel.app` di PWABuilder.
2. Simpan release signing key; jangan mengganti key antar-rilis.
3. Fingerprint SHA-256 sertifikat release PWABuilder saat ini adalah `7C:51:6D:D7:F7:81:B5:15:32:FC:C2:CE:64:8A:D6:D1:E9:7E:C1:EE:21:D9:07:3E:EC:B6:65:88:5B:1E:B4:1E`.
4. `public/.well-known/assetlinks.json` harus tetap cocok dengan package dan signing key release:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.vercel.vulpixlabs.twa",
      "sha256_cert_fingerprints": ["7C:51:6D:D7:F7:81:B5:15:32:FC:C2:CE:64:8A:D6:D1:E9:7E:C1:EE:21:D9:07:3E:EC:B6:65:88:5B:1E:B4:1E"]
    }
  }
]
```

Setelah deploy, pastikan `https://vulpixlabs.vercel.app/.well-known/assetlinks.json` merespons `200` tanpa redirect, lalu uji APK release di perangkat. Jika package atau fingerprint tidak cocok, address bar/domain dapat muncul. Jangan commit `signing.keystore`, password, atau file informasi signing; `.gitignore` memblokir artefak tersebut.

Avatar project Vercel diatur manual melalui dashboard menggunakan `public/icons/icon-512.png`; avatar project bukan favicon aplikasi.

## Rollback

Gunakan **Deployments → deployment terakhir yang sehat → Promote to Production**. Jangan menghapus key Redis saat rollback; cache lama sengaja dipertahankan sebagai fallback ketika upstream gagal.
