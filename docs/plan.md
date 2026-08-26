# Plan — Revisi Landing + Arena 3-Col (Light Theme, No AI Slop)

## Prinsip Tema
**Strict palette** `exotic #F54F1B | paper #fff | ink #000` `radius 0rem` `border-2 border-ink` `shadow-[6px_6px_0_0_#000]` `font-sans Figtree` `font-serif Instrument_Serif` `label tracking 0.3em`. Arena clone struktur openrouter 1:1 tapi skin light brutalist kita. Chart heat orange (exotic → amber → ink/20), bukan biru/gelap. No gradients AI slop.

## A) Landing Copy Total (no "Hugging Face", no "—")
- `hero.tsx` `The front door to Open Source AI.` → ganti total hero title/sub tanpa em dash: `The front door to open intelligence. Search live. Chat and rank.`
- `manifesto.tsx:77` `The frontier is open.` keep `font-serif italic text-exotic` pada frase itu saja, rewrite paragraf full, scrub em dash
- `ecosystem.tsx` `Index/Playground/Arena API` clickable with `cursor-pointer` + `router.push`, warna hover `bg-exotic`
- `open-source.tsx` `Live Playground` mock tidak clickable (hanya CTA), input `How can I help you today?` + `+ v mic ↑` identik `composer.tsx:383` (PlusIcon, ChevronDown, MicIcon, ArrowUpIcon), thinking `pg-spin` + `pg-dots`
- `how-it-works.tsx` `Search. Filter. Prove.` keep, rewrite desc
- `faq.tsx` 8 Q rewrite, `mega-footer.tsx` `Syncs live — no cache` → `Syncs live, no cache`
- Verify `grep -r "—" src/components/sections` =0, `font-serif` hanya di heading `The frontier is open.`

## B) Benchmark Menu
- `site-navbar.tsx` hapus `Arena` dari `datasetLinks`, buat `benchmarkLinks` 3 items `Leaderboard / Compare / Pricing` → `/arena#*`. Desktop `NavigationMenuItem Benchmark` dengan `NavGridCard`, Mobile `AccordionItem Benchmark`. Image3 (`ecosystem` bar ketiga) hapus.

## C) Arena API — Realtime OpenRouter
- `src/app/api/arena/models/route.ts` `GET https://openrouter.ai/api/v1/models` reuse `playground/models loadOpenRouter` cache 10m, expose `id, name, provider, icon, context_length, pricing.prompt/completion, created`. Real-time, fallback mock JSON 3 model jika 5xx.
- `src/app/api/arena/benchmark/route.ts` `GET ?models=claude-fable-5,gpt-5.5` → map pricing/context from models, inject mock `latency 1.1-1.85s / throughput 110-140 t/s` + `features json_mode etc` + `analysis_scores` + `activity_24h` dari mock user. `revalidate 60`.
- Docs: https://openrouter.ai/docs/api_reference/overview — header `Authorization: Bearer <key>` optional for public models, else anonymous.
- Types `src/lib/arena/types.ts` + `mock.ts` (JSON user) + `src/lib/arena/openrouter.ts` helper.

## D) Arena UI — Sticky 3-Col, Expandable, Beginner Tooltips
- `src/app/arena/page.tsx` ganti placeholder → client `ArenaCompare` full `max-w-[1280px] mx-auto px-6`.
- Header: title `Claude Fable 5 vs Gemini 3.1 Pro Preview vs GPT-5.5` + desc + toolbar `Highlight best / + Add model / Chat`.
- Sticky selector `grid md:grid-cols-3 gap-4 sticky top-[72px] bg-paper z-20 border-b-2 border-ink pb-4`: default col1 `anthropic/claude-fable-5`, col2 `google/gemini-3.1-pro-preview`, col3 `openai/gpt-5.5`, tiap card `icon + name + provider + badge + X + dropdown provider`.
- Sections `Overview (Context Length + Capabilities badge Text Image Audio)`, `Pricing (Biaya Membaca / Menulis per 1M, 2 rows, decimal rapi)`, `Performance (Kecepatan Respon Latency tooltip "Waktu tunggu sampai model mulai menjawab" + Kecepatan Generasi t/s)`, `Features (JSON Mode / Function Calling / Stream ✓/✗)`. Tiap section `Accordion type=single collapsible` atau `Collapsible` dengan `GSAP from y 16 autoAlpha`.
- Beginner tooltip: `shadcn Tooltip` + `?` icon di label.

## E) Charts — Orange Heat, No AI Slop
- Lib `recharts` (sudah ada via `shadcn`? cek, jika belum `npm i recharts`). 3 grouped bar `Intelligence / Pricing / Agility` side-by-side, 3 batang per chart warna `exotic #F54F1B`, `amber #F59E0B`, `ink #000` heat. `BarChart` `radius 0`, `grid stroke ink/10`, `label` sans.
- 3 area `Activity 24h` orange gradient `from exotic/28 to transparent` stroke `exotic`, `XAxis` 24h, breakdown `Prompt / Completion / Reasoning` di bawah via `label` mono.
- Animation `GSAP from y 32 autoAlpha stagger 0.12` untuk charts, `ScrollTrigger`.

## F) Skills & MCP Matrix
- Skills: `copywriting` (FOMO no HF), `brand` (Instrument serif), `impeccable` (brutalist check), `frontend-ui-engineering` (shadcn), `reactbits` (CountUp), `gsap` (ScrollTrigger), `shadcn` (Card/Badge/Select/Tooltip/Accordion/Table), `context7` (recharts, radix)
- MCPs: `chrome-devtools_take_snapshot` (font-serif check), `playwright_browser_take_screenshot` (3-col, chart), `chrome-devtools_evaluate_script` (no — check), `webfetch` openrouter docs, `tavily` awwwards heat palette
- Verify: `next build` pass, `grep —` 0, `font-serif italic text-exotic` only on frontier phrase, chart heat screenshot vs Image1, realtime fetch `GET /api/arena/models` 200

## Risiko
- OpenRouter 429 → fallback mock. Fake ids `claude-fable-5` → map to `anthropic/claude-3.5-sonnet` real. Chart SSR hydration → dynamic import.

---

# Round: Redis Sync + PWA (2026-08-26) DONE

## Redis Sync (ioredis, Redis Cloud TCP via REDIS_URL)
- `lib/redis.ts` client global + getJson/setJson never-throw
- `lib/sync.ts` fetchHFModels(100 likes) + fetchOpenRouterModels(pricing+architecture+supportedParameters) + combineModels join-by-id
- `api/cron/sync` Bearer CRON_SECRET 401 guard; gating timestamp `models:last:hf`(12h)/`models:last:or`(1h); force=hf|or|all; fallback never deletes old keys
- Keys: `models:huggingface:data` EX43200, `models:openrouter:data` EX3600, `models:all:combined` EX3600
- `api/models` public q/limit/offset; fallback chain redis-combined -> redis-recombined -> live-fetch; s-maxage 60
- `vercel.json` crons 0 * * * * + 7 */12 * * * (same route, timestamp gating)
- E2E: 401/401/200 {hf:synced,or:synced,combined:505}; del combined -> source redis-recombined 505

## PWA (Serwist Turbopack, pwabuilder-ready)
- Deps @serwist/turbopack@9.5.12 + serwist + esbuild(dev); next.config withSerwist (serverExternalPackages esbuild)
- `app/sw.ts` Serwist precache self.__SW_MANIFEST + defaultCache + fallbacks /~offline; /// <reference lib=webworker/>
- `app/serwist/sw.js/route.ts` createSerwistRoute swSrc src/app/sw.ts; GET adapter params path:'sw.js' (esbuild outdir cwd entry out sw); dynamic/dynamicParams/revalidate hardcoded literal (Next static-parse)
- `app/~offline/page.tsx` brutalist offline; `components/pwa.tsx` SerwistProvider swUrl /serwist/sw.js
- `app/manifest.ts` id/name/short_name/start_url/scope/display standalone/orientation/bg #000/theme #F54F1B/categories/4 icons (192+512 any & maskable dari fox logo 1254px, maskable scale 78%)/2 screenshots (wide 1280x720 landing, narrow 720x1280 hub)/3 shortcuts (Hub/Playground/Arena)
- layout.tsx metadataBase+applicationName+title template+manifest+appleWebApp(capable black-translucent)+formatDetection+OG+twitter+icons+viewport themeColor viewportFit cover
- Icons: public/icons/icon{,-maskable}-{192,512}.png + apple-touch-icon.png via System.Drawing
- E2E: SW active /serwist/sw.js 62KB; offline network -> /~offline renders YES; assets 200

## Lint Fixes
- cron route unused CombinedModel import; arena unused ArrowUpRight/Check/FlaskConical/X/Badge; setKeyInput sync-in-effect -> Promise.resolve microtask
- tsc 0, eslint clean, build 23 routes

## Docs
- DEPLOY.md: GitHub push -> Vercel import -> Storage connect Redis (env auto-inject) -> env vars table -> cron verify -> fallback chain -> PWA test

---

# Round: Arena Realtime Overhaul (2026-08-26) DONE

## Data Realtime (semua dari API resmi OpenRouter, Bearer env key)
- `lib/sync.ts` +fetchBenchmarks (AA intelligence/coding/agentic 140 model + design-arena elo/winRate/avgGenMs 139 model x 14 kategori) +fetchActivity (datasets/rankings-daily 30 hari, fuzzy permaslug match) +fetchEndpoints (providers + quantization + weighted avg input)
- Redis keys: `models:openrouter:benchmarks` + `models:openrouter:activity` TTL 6h, gating `models:last:bench/act`; cron force=bench|act
- Routes: `api/arena/benchmarks` (redis->live), `api/arena/activity?slugs=` (fuzzy match permaslug), `api/arena/providers?slug=` (cache per-slug 1h); semua terima header `x-or-key` fallback client
- `lib/brand-logos.ts` +authorFavicon -> Google s2/favicons + domain map 30+ author
- `lib/arena-format.ts` formatTokensCompact/formatPricePerM/matchKey/monthLabel/dayLabel

## UI (components/arena/*, shadcn + GSAP, skill impeccable)
- model-picker: dropdown Image1 persis (search + N models + filter icon, group bulan August 2026, favicon google, hover bg-exotic, GSAP fade, esc/click-out)
- provider-select: shadcn DropdownMenu Auto + providers real
- section-table: grid repeat(n,1fr) label kiri value kanan tabular-nums, tooltip info, Dash "-" untuk kosong; CheckMark SVG oranye/ink
- benchmark-charts: 3 chart Intelligence/Coding/Agentic top-10 AA + selected highlight oranye #F54F1B/#FF8C4A/#FFB37F/#FFD1AD, sisanya putih border, GSAP scaleY grow, x-label rotate -38deg favicon
- design-arena: Tabs Table (elo + win% oranye) | Graph (bar horizontal winRate)
- activity-chart: total compact + 30 bar harian bg-exotic + grid + tanggal, GSAP stagger
- page: toolbar Switch Highlight best + Add model (max 4 kolom) + Chat; key bar opsional (x-or-key); sticky selector 2 baris (model picker + provider + ikon info/external/X); 6 sections realtime: Overview/Pricing 10 rows/Performance (latency dari DA avgGenMs else "-")/Features 6 rows real/Benchmarks (AA + DA)/Activity + attribution CC-BY
- Default = top-3 AA intelligence (resolve permaslug->list id via strip -YYYYMMDD); nama fallback AA displayName
- Warna: hitam hanya teks; fill oranye/putih bergantian (verified orangeOnly:true); h1 30px/h2 18px hierarki

## Fixes saat eksekusi
- Tooltip must be within TooltipProvider -> provider dipindah root page
- nex-ai unquoted key TS1005; react-hooks set-state-in-effect -> queueMicrotask + reset query di event handler; ref mutation render -> effect; exhaustive-deps -> useCallback keyRef
- Playwright: networkidle tak pernah (505 favicon eksternal) -> waitUntil load + route.abort eksternal; tab click covered sticky -> evaluate dispatch

## E2E
- cron force=bench+act synced; routes 200 redis source; H1 "Claude Opus 5 (Fast) vs Claude Fable 5 (...) vs GPT-5.6 Sol Pro"; 4 kolom; tabs Table/Graph; 30 AA bars orangeOnly; 33 act bars; sections text semua ada; 0 pageerror; tsc 0, eslint clean, build green

---

# Round: Preloader v2 + Custom 404 + HF 6h (2026-08-26) DONE

## Preloader "The Index" Orange Edition (components/preloader.tsx rombak total)
- Background penuh bg-exotic: persentase serif italic paper raksasa, word-cycling mask reveal putih (Indexing models -> Syncing benchmarks -> Ranking the frontier -> Opening the gates), logo invert putih clip-path reveal, progress line paper tepi bawah scaleX sync counter
- Exit double-curtain: orange panel yPercent -100 (2.4s, .75s power4) -> paper curtain menyusul 2.52s; content .pl-fade fade-up 2.25s; total exit ~3.27s
- Session gate sessionStorage mh_preloaded: sekali per sesi; skip -> html.hz-instant + hero delays collapsed (globals .hz-instant overrides, tick pakai calc(var - 4.25s))
- Hydration fix: useState(sessionStorage) -> React #418; diganti two-pass useState(false) + useIsoLayoutEffect (useLayoutEffect client) sebelum paint, tanpa flash
- Hero re-sync: hz-line 3.35s / sub 4.0 / bar 4.4 / tick 4.8 / preview 5.2 (globals.css), hero.tsx --hz-delay base 4.8
- Reduced-motion skip + scroll lock + kill-switch 6s dipertahankan

## 404 Lost in the Frontier (app/not-found.tsx + components/not-found-client.tsx BARU)
- Server not-found.tsx metadata title 404 (-> 404 | MaventHub) render NotFoundClient
- 404 serif italic exotic clamp(7rem,26vw,17rem) per-char stagger y140 rot10; h1 Lost in the frontier mask rise; sub + CTA Back to Hub / Go Home brutalist shadow
- 2 marquee strip infinite GSAP xPercent loop 24s (bawah reverse), strip bg-exotic border-y-2 ink
- Fox miring -6deg hover/click elastic shake; mouse parallax quickTo pada numeral
- Reduced-motion: marquee + entrance skip

## HF 12h -> 6h
- route.ts HF_TTL_SECONDS 43200->21600, HF_INTERVAL_MS 12h->6h; vercel.json 7 */12 -> 7 */6
- Verified: cron force=hf synced, Redis TTL models:huggingface:data = 21595s (~6h)

## E2E Playwright (engine sama MCP, via node script)
- Preloader: orange rgb(245,79,27), counter 00->97, word cycle tercapai, exit bersih hero opacity 1
- Reload: skipped:true sessionFlag:1 hz-instant:true
- 404 /xyz-ngawur: notDefault:true, chars+heading+CTA+2 strips+marquee, title 404 | MaventHub
- PAGEERRORS: 0 (hydration fixed); tsc 0, eslint clean, build green
- Screenshots: pre-early.png, pre-mid.png, notfound.png

---

# Round: Preloader Polish + Rombak 3 Section (2026-08-26) DONE

## Setup
- npm i @phosphor-icons/react (ikon bento persis kode vengenceui)
- opencode.json BARU: mcp ui-layouts (npx @ui-layouts/mcp) + magicui (npx -y @magicuidesign/mcp@latest), local stdio enable true -> aktif setelah restart sesi; sesi ini pakai webfetch registry (github raw magicui animated-beam)

## Preloader Polish
- Word status text-2xl/4xl -> text-4xl/md:text-6xl (verified 60px); logo h-7 -> h-12/md:h-16 (verified 64px) + label text-base/lg

## Manifesto FULL REWORK (sections/manifesto.tsx)
- Giant numbers background: 3 serif italic outlined (500k+/100k+/50+), WebkitTextStroke ink/exotic transparan, parallax scrub yPercent beda speed
- Foreground: label + copy clip-path mask rise + sub line word-stagger (mani-word 14 kata, stagger 0.035)
- Stat rows brutalis: StatsCounter count-up (verified 500k+/100k+/50+ saat scroll) + bar scaleX exotic, border-t-2

## Pillars -> Agent Bento Grid (sections/pillars.tsx rombak total, kode vengenceui diadaptasi)
- FeatCard + 5 kartu framer-motion, brutalis: rounded-none border-2 shadow offset, skala oranye saja (#F54F1B/#FF8C4A/#FFB37F/#FFD1AD), tanpa dark:, phosphor icons
- Card1 Index Pipeline (SEARCH->Router->INDEX->HUB/ARENA, pathLength flow 2s cycle), Card2 Live Index Monitor (505/279 real + sparkline + bars 7 hari), Card3 Frontier Feed (stack spring GPT-5.6/DeepSeek/Ultra-FineWeb), Card4 Sync Sources (huggingface/openrouter/redis/arena + sync log, col-span-2), Card5 API Inspector (4 endpoint real + latency)
- Heading: One engine. The whole frontier.; grid 3 atas + 2 bawah, mobile 1 kolom no overflow (verified)
- eslint: ref-during-render fix (3 useRef terpisah + nodeArr), unused ChatCircle removed

## Ecosystem -> Animated Beam (magicui)
- components/magicui/animated-beam.tsx (source resmi magicui, motion/react, ResizeObserver path recalc)
- ecosystem.tsx: kiri core node (logo + MaventHub Core + 505 models live ping), kanan 3 API node (Index/Playground/Arena, Link + hover bg-exotic), 3 beam oranye curvature -70/0/70 delay stagger, path ink/18
- GSAP: head reveal, core back.out pop, rows stagger x

## E2E
- Preloader 60px/64px; manifesto giants 3 words 14 counters count-up; bento 5 cards spans [1,1,1,2,1] mobile 1-col; eco 3 beam svg 6 path; PAGEERRORS 0; tsc 0; eslint clean; build green
- Screenshots: pre-big, sec-manifesto, sec-bento, sec-eco, sec-bento-mobile

---

# Round: VULPIX Rename + Logo White + Preloader Replay + Section Revisi DONE
## RESULT (2026-08-26) — as above

---

# Round: Stabilisasi Hub/Arena + Manifesto Card + Landing Revisi (2026-08-26) DONE
## Masalah user
- Hub `0 models` / `No models found` untuk `?task=text-generation`, tabrakan layout, loading lambat
- Landing ngeload versi lama dulu baru versi baru (SW stale 24h)
- Manifesto plain, GSAP counting gk jalan (Image)
- Bento What is Vulpix: terpotong, labels mepet cards, masih sebut HuggingFace/OpenRouter
- Ecosystem: spacing badge ke cards kejauhan, isi cards plain perlu animasi (beda dari bento)
- Marquee: logo tidak putih seragam, plain perlu card
- Footer `Syncs live — no cache` ganti (pilih `Data streams live`)

## Fix
### PWA stale (sw.ts)
- `defaultCache` html/rsc/pages 24h -> busted ke `pages-v2` 5m NetworkFirst 3s timeout; `apis` 24h -> `apis-v2` 60s NetworkFirst 5s
- Tambah `navigationNetworkOnly` (request.mode navigate -> NetworkOnly) di depan runtimeCaching, hilangkan flash old HTML
- `precacheOptions.cleanupOutdatedCaches` true; verifikasi 373 entries tetap precache

### Hub/Arena lambat & tabrakan
- `lib/hf.ts` listModels/listDatasets `revalidate 60->30` + `signal AbortSignal.timeout(12s)`
- `app/api/hf/*` apis tetap, tapi SW tidak lagi cache 24h
- `app/hub/page.tsx` ModelsPanel & `components/hub/dataset-hub.tsx` grid `lg:grid-cols-[240px_1fr]` -> `lg:grid-cols-[240px_minmax(0,1fr)]` + `min-w-0 overflow-hidden`, `fetchPage` tambah `signal 15s` + `r.ok` guard + hidden empty false
- `app/arena/page.tsx` `/api/models?limit=1000->500` + 15s timeout + `r.ok` guard + activity/providers 12s/10s
- Hasil: `/api/hf/models?task=text-generation&limit=5` 200 5 items; `/api/models` redis-recombined 100 total; hub `30+ models` 30 cards, `No models` 0; benchmarks/activity redis 140/1

### Branding
- `package.json` sudah vulpix, `public/vulpix-logo.png`, SW cache bust menghilangkan preload maventhub-logo.svg warning (akan hilang setelah rebuild)

### Manifesto FULL REDesign (sections/manifesto.tsx rombak total)
- Hapus plain paragraph+border-t. Ganti grid 12-col card-based brutalist `border-2 border-ink shadow-[6px_6px_0_0_#000]`
- Kiri 8-col: statement card putih dengan accent bar exotic + copy `The frontier is open.` italic
- Kanan 4-col: principle card bg-exotic text-paper dengan chips Search/Chat/Rank
- 3 stat cards 4-col: `NumberTicker` framer-motion `useInView+useSpring` count 0->500/100/50 + suffix `k+`/`+` delay 0.3+0.12i, bar `motion scaleX` 0.9s, `BlurFade` stagger
- Counting kini jalan on-scroll (memperbaiki GSAP yang sebelumnya tidak ada)

### Bento (sections/pillars.tsx)
- `FeatCard` `p-4 gap-2` -> `p-5 md:p-6 gap-3` + inner `p-1`, visual tidak lagi mepet
- `MonitorCard` gaps `gap-4->5` + `p-3->3.5` + shift `0.5rem->0.35rem` (tidak terpotong), h `gap-3.5->4 p-1.5`
- Grid `gap-4` -> `gap-5 md:gap-6`, card `h-[280]->h-[320] md:h-[340]`
- `Sync Sources` rename `huggingface->index`, `openrouter->rankings`, `redis->cache`, queries & badges ikut, desc -> `Upstream index every 6 hours, live rankings hourly, combined in cache.` (no HF/OR)

### Ecosystem (sections/ecosystem.tsx)
- Spacing `pt-24/pb-24 top 6rem` -> `pt-20 lg:pt-24 / pb-16 / pt-14 top 4rem + i*22` (badge ke card pertama rapat)
- `StackCard` redesign: kanan bukan hanya ul, tambah mini animasi per card:
  - IndexMini: ticker vertikal 4 rows loop y -54 (beda dari Pipeline)
  - PlaygroundMini: typewriter `Explain quantum…` + cursor blink + 3 shimmer bars
  - ArenaMini: elo board 3 bars width pulse + angka 1200+ (beda dari Monitor bars)

### Marquee (sections/marquee.tsx)
- Semua logo via `cdn.simpleicons.org/{slug}/ffffff` putih seragam (hapus svgl dark)
- Daftar 24 labs: OpenAI/Anthropic/DeepSeek/Meta/Gemini/Mistral/Qwen/Databricks/Cohere/NVIDIA/Microsoft/Perplexity/Grok(xai)/Replicate/Google/Amazon/aws/Naver/Palantir/ElevenLabs/Snowflake/GitHub/Vercel/Cloudflare/Supabase
- `LogoItem` jadi card `h-[52] border border-paper/15 bg-paper/10 px-5 backdrop-blur`, img `h-6` + `onError hide`, gap-4 pr-4
- Hasil 48 items (24x2) border terlihat (akan direvisi 36 di round berikut)

### Footer
- `sections/mega-footer.tsx:135` `Syncs live — no cache` -> `Data streams live`

## E2E (Playwright, localhost:3000 rebuilt)
- Build green, 373 precache entries, hero-dither 2.24MB warning only
- Server 200 OK, `/api/hf/models` 200, `/api/models` redis-recombined 100
- Landing: footer 1, manifesto 2 cards+numbers, bento 5 cards no HF text true, eco live-index 7 elo 1, marquee 48 card borders, hub 30+ models 30 cards nomodels 0, arena h1 vs Claude Opus loaded
- Screenshots: landing-full.png, sec-manifesto-new.png, sec-bento-new.png, sec-eco-new.png, sec-marquee-new.png, footer-new.png, hub-new.png, hub-task-new.png, arena-new.png
- PAGEERRORS 0, tsc 0

## RESULT (2026-08-26) DONE (existing VULPIX block preserved above)
## RESULT (2026-08-26) — stabilisasi done

---

# Round: Fine-tuning Bento + Marquee Model-Only + Arena Highlight (2026-08-26) DONE
## Masalah lanjutan (Image 1-3 + Arena)
- API Inspector card logo `h-[28]` `p-2.5` `gap-2` mepet garis (Image 1)
- Sync Sources `h-[320]` terpotong baris `cache/arena` di `overflow-hidden` (Image 2)
- Live Index Monitor `MODELS/BENCHMARKS` label `p-3.5` menyentuh `border` (Image 3)
- Marquee masih `GitHub/Vercel/Cloudflare/Supabase/Snowflake` infra, duplikat `Qwen/Alibaba` `Grok/xAI`; user mau model-logo putih only
- Arena Benchmarks orange highlight tidak pindah saat ganti model (Image 4, permaslug mismatch)

## Fix
- `pillars.tsx:32-48` FeatCard `p-5 md:p-6 gap-3` + inner `p-1->p-3`; `ApiCard:697-704` `grid gap-2->3 p-2.5->3` + wrapper `p-2`; `MonitorCard:258-271` `gap-4 p-1.5->p-2` + inner `gap-5->6 p-2`; grid `CARDS` `h-[320]/340->h-[340]/360` & wide `h-[400]/420` untuk Sync Sources (tidak potong)
- `marquee.tsx:3-28` kurasi 18 model-labs only: Qwen/Llama/Gemini/Gemma/Mistral/DeepSeek/Phi/Flux/Cohere/Nemotron/GPT/Claude/Grok/Replicate/Solar/Yi/Databricks/ElevenLabs (hapus GitHub/Vercel/Cloudflare/Supabase/Snowflake/Palantir/Naver/Amazon infra, dedup Qwen/Grok), putih `ffffff` card `h-[52] border-paper/15` 36 items (18×2)
- `arena-format.ts:41` tambah `permaBase()` + `matchKey` fix `base` compare; `benchmark-charts.tsx:84-87,106-108` highlight `permaBase(s.id)` vs `bar.slug`
- `DEPLOY_CHECKLIST.md` baru: env REDIS/CRON/HF/OR, cron 0 * / 7 */6, verify curl, SW bust `pages-v2`

## E2E (rebuild kedua, localhost:3000)
- Build green, SW 373 entries, server 200
- Landing: footer 1, manifesto 2, bento 5 no HF `Hugging Face every` false, eco live 7 elo 1, marquee 36 card Qwen 5 GitHub 0, hub `30+ models` 30 cards nomodels 0, arena `Claude Opus 5 vs ...` loaded
- Screenshots: final-landing.png, final-arena.png (Playwright MCP)

---

# (archived) Round: VULPIX Rename + Logo White + Preloader Replay — RESULT as above

- Skills used: impeccable craft-floor (loaded earlier, applied: contrast/spacing/states/no-slop bans); MCP: magicui (blur-fade+glare-hover source+install via shadcn CLI), ui-layouts (stacking-card source), shadcn registry (index verified no pricing block -> composed from primitives), reactbits (evaluated, SpotlightCard not needed), Playwright scripts for QA
- Manifesto: rebuilt clean editorial (BlurFade stagger, static stat strip 500k+/100k+/50+, copy 24px, giants=0 verified, no countup)
- Bento: FeatCard whileInView once margin -60px; GSAP only on heading; E2E 5/5 cards visible (load bug FIXED)
- Ecosystem: Stacking Cards via useScroll/useTransform scale (ui-layouts math, NO Lenis), 3 API cards white rounded-2xl hairline + accent dots + check lists, header + live badge Vulpix Core
- Pricing NEW after HowItWorks: Free  / Pro \ (yearly \, -20% badge, highlight border-exotic + Most popular) / Enterprise custom; shadcn Card+Badge+Switch+Button + GlareHover glare + BlurFade; toggle verified
- Rename: 16 files bulk + manual (footer wordmark VulpixLabs italic, (c) 2026 VulpixLabs, skills prompt You are Vulpix, db vulpix-playground, package.json vulpix, hero hub.vulpix.ai, tagline 'The intelligent gateway to AI' di preloader label + layout DESCRIPTION + manifest description, domain vulpix.vercel.app); rg -i maventhub src = 0
- Logo: flood-fill Playwright canvas (edge-connected black -> transparent, fox face blacks preserved) -> public/vulpix-logo.png (transparent bg, corner alpha 0, fox orange); refs swapped .svg->.png (navbar/preloader/404/eco/sidebar/chat-view); old SVG deleted; PWA icons 5x regenerated white bg
- Preloader replay: module-gate played (no sessionStorage); refresh landing = plays (verified), SPA back from playground = skipped (verified), hydration-safe
- E2E: preloader 60px/64px+tagline, navbar Vulpix+/vulpix-logo.png, manifesto giants0/statstrip/copy24px, bento 5/5, eco 3 sticky+badge, pricing 3+toggles, footer VulpixLabs, mobile no-h-scroll, PAGEERRORS 0
- Screenshots: vx-preloader, vx-manifesto, vx-bento, vx-stack, vx-pricing, vx-pricing-mobile, vx-footer

---

# Round: Performance Optimization (CWV) - RESULT

## Goal
- Maksimalkan CWV tanpa menyentuh animasi (GSAP/motion/hz-*), preloader 3.27s tetap, FE/BE tidak break

## Patches Applied
- next.config.ts: compress, poweredByHeader false, images AVIF/WebP + remotePatterns (simpleicons/hf-avatars/google/svgl) + minimumCacheTTL 86400, optimizePackageImports [lucide-react,@phosphor-icons/react], immutable header icons/apple-touch-icon
- layout.tsx: Figtree weights 400/500/600/700 preload + fallback system-ui; Instrument Serif preload fallback ui-serif Georgia
- site-navbar.tsx: logo Image sizes=48px (hapus unoptimized)
- Deps: uninstall three/@react-three/fiber/drei/@types/three (~53 pkgs, -280KB)
- api/models/route.ts: COMBINED_TTL 7200 + Cache-Control s-maxage=300 SWR=86400 stale-if-error=600 + Vary
- sw.ts: apis-v2 maxEntries 64 maxAgeSeconds 120
- hf routes (models/datasets list + [id]): Cache-Control public s-maxage=30/60 SWR=600
- hf.ts: revalidate 60 kedua list
- arena benchmarks/activity: write-through setJson TTL 21600 + s-maxage=600 SWR=1200 + Vary x-or-key; providers headers sama
- vercel.json: cron dedupe, hanya hourly 0 * * * *
- DEPLOY_CHECKLIST.md: env REDIS_URL/CRON_SECRET/HF_TOKEN/OPENROUTER_API_KEY + verify curls

## Build + E2E Verify (production build, localhost:3000)
- Build GREEN: compile 17.9s, TS clean, serwist 373 precache entries; warning hero-dither.png 2.24MB tidak diprecache (by design)
- API headers verified: /api/models s-maxage=300 SWR=86400 SIE=600; /api/hf/models s-maxage=30 SWR=600; /api/arena/benchmarks s-maxage=600 SWR=1200
- Playwright sweep PASS: no horizontal overflow di 1280/768/390 (scrollW==innerW semua)
- Bento row2 Sync Sources vs API Inspector = 420/420 diff 0
- Footer 'Data streams live' ada (uppercase styling); marquee 36 white model-labs + 8 orange ecosystem logos benar
- Hub: label 30+ models, 30 cards, No models found 0
- Arena: loaded (div-based leaderboard, compare mode text), mobile 390 no overflow
- Screenshots: perf-desktop-1280.png, perf-tablet-768.png, perf-mobile-390.png, perf-hub-desktop.png, perf-arena-desktop.png, perf-arena-mobile.png

## Notes
- CWV target ~75-85 (LCP 5.2s karena preloader preserved - accepted)
- Local dev tanpa REDIS_URL tetap slow-fallback 15s; deploy Vercel+Redis <50ms

---

# Round: Security Audit + Hardening - RESULT

## Audit Findings (read-only sweep, skills: security-and-hardening)
- F1 KRITIS: zero security headers (CSP/XFO/XCTO/Referrer/Permissions) - confirmed via live response
- F2 KRITIS: SSRF /api/playground/test custom baseURL (fetch URL arbitrary, localhost/metadata reachable)
- F3 KRITIS: orHeaders() fallback OPENROUTER_API_KEY di arena routes saat cache miss -> quota-drain DoS via spam slug unik + Redis key space tak terbatas models:providers:<slug>
- F4 KRITIS: zero rate limiting semua API publik (chat proxy LLM 120s paling rawan)
- F5: dataset-viewer length/offset tak divalidasi; F6: Vary x-or-key fragmentasi cache CDN; F7: cron compare non-timing-safe; F8: chat error passthrough; F9: hf id path interpolasi tanpa validasi
- AMAN: secrets client bundle bersih (hanya NEXT_PUBLIC_SITE_URL), .env* gitignored, npm audit prod 0 vuln, react-markdown v10 urlTransform + tanpa rehype-raw, shiki escaped, Redis keys app-side hardcoded, CRON fail-closed, avatar route safeAuthor+allowlist

## Fixes Applied (backend/config only - zero UI/design/animation files touched)
- next.config.ts: global headers /:path* -> XFO SAMEORIGIN, XCTO nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy minimal, CSP pragmatis (script/style unsafe-inline utk Next+shiki, img-src allowlist remotePatterns + *.gstatic.com favicon, frame-src self utk hero /hub embed, frame-ancestors self)
- lib/rate-limit.ts NEW: fixed-window INCR+EXPIRE via ioredis (shared antar lambda Vercel) + in-memory fallback per-instance; rateLimit(), acquireLock() NX, budgetSpend()
- lib/ssrf.ts NEW: assertPublicHttpsUrl https-only + DNS resolve all + blokir private/reserved IPv4/v6/CGNAT/metadata ranges
- chat route: limit 20/5min + body cap 256KB + baseURL SSRF check + error generik (F8)
- test route: limit 10/min + custom fetch redirect-manual loop max4 hop dengan re-validasi tiap hop
- models playground route: limit 30/min + custom baseURL SSRF check
- hf routes (lists 60/min, detail/readme/avatar 120/min, viewer 60/min): rateLimit
- arena providers: slug regex clamp ^[a-z0-9._-]+/[a-z0-9._-]+\$ max120 + negative-cache 60s + per-slug lock NX 60s + global budget 40 live-fetch/min
- arena benchmarks/activity: lock NX 60s + budget 10/min + 503 Retry-After saat sync berlangsung
- dataset-viewer: offset>=0, length 1..100, config/split charset clean
- cron: timingSafeEqual; Vary x-or-key dihapus dari 3 arena routes (F6)

## Iterasi CSP (2x fix setelah Playwright menemukan regresi)
- v1 frame-ancestors none + XFO DENY MEMBLOKIR hero iframe /hub same-origin -> diganti 'self'/SAMEORIGIN (clickjacking tetap tercegah)
- img-src kurang t*.gstatic.com (logo provider arena/playground keblok) -> tambah https://*.gstatic.com

## Verify (production build x3 green, localhost:3000)
- Headers live terpasang lengkap; SSRF guard tolak http://localhost ("only https:// endpoints are allowed"); rate limit 429 aktif (req #10+ diblok, Retry-After terkirim); arena/providers tetap return data normal via lock+budget path
- Playwright sweep: desktop/tablet/mobile landing+hub+arena+playground overflow=false semua, footer ok, marquee 36 white, hero iframe render, images loaded (arena 34/playground 28/landing 26), broken non-simpleicons=0, CSP violations=NONE
- Catatan: 404 cdn.simpleicons.org utk beberapa slug (openai/microsoft/stabilityai/01dotai/xai/upstage/cohere) = pre-existing CDN, onError sudah hide, tidak disentuh
