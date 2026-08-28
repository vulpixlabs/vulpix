# Contributing to Vulpix

Private repository `vulpixlabs/vulpix` — Teams: `core` (Admin), `dev` (Write), `qa` (Triage). All changes via PR to `main` (protected).

## Prerequisites

- Node.js `22.x`, npm, Git
- Upstash Redis REST DB (direct, not Vercel Marketplace) + HF/OpenRouter tokens

## Setup

```bash
git clone https://github.com/vulpixlabs/vulpix.git
cd vulpix
npm ci
cp .env.example .env.local
# fill UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET, HF_TOKEN, OPENROUTER_API_KEY
npm run dev
# http://localhost:3000
```

Bootstrap cache:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/sync?force=all"
```

## Quality Gate (must pass)

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e          # Playwright Chromium + WebKit + Mobile
npx playwright test --ui  # optional UI
```

Branch `main` requires PR + `QA` workflow status checks. Dismiss stale approvals enabled.

## Teams & Access

| Team | Role | Access |
|---|---|---|
| `core` | Admin | merge, settings, secrets |
| `dev` | Write | push branches, open PRs |
| `qa` | Triage | review, run QA |

Invite: GitHub Org → People → Invite → Add to Team.

## Commits

- Small, focused PRs
- Message: `feat:`, `fix:`, `chore:` prefix
- No secrets in commits (`.env.local` is ignored)

## Security

- Never commit `.env.local` or tokens
- Use org secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET` (Settings → Secrets → Actions → Selected repos: vulpix)
- Cron uses `timingSafeEqual`, rate-limit `ioredis` replaced by Upstash pipeline

## PWA

Serwist precaches ~386 entries (`pages-v2` 5m, `apis-v2` 120s). After SW changes: `DevTools → Application → Clear Storage`.

## Questions

Open an issue in `vulpixlabs/vulpix` (private) or contact `core` team.
