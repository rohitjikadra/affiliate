# AffiliateHub

Affiliate product discovery + comparison platform. Next.js shop/CMS talks to an Express API through same-origin `/api` rewrites. Amazon is one merchant among many.

```
Browser  →  Next.js :3000
              /api/*  and  /go/:offerId  →  Express :4000
              Prisma  →  PostgreSQL
Worker   →  same Postgres (SKIP LOCKED jobs)
```

## Apps

| App | URL | Scripts |
| --- | --- | --- |
| Frontend | http://localhost:3000 | `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck` |
| Backend | http://localhost:4000 | `npm run dev`, `npm run build`, `npm run start`, `npm run typecheck`, `npm test` |
| Worker (dev) | (second Node process) | `npm run worker` from `backend/` (`tsx src/worker.ts`) |
| Worker (production) | (second Node process) | `npm run start:worker` after `npm run build` (`node dist/worker.js`) |

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 14+ (or Docker Compose below)

## Database (optional Docker)

```bash
docker compose up -d postgres
```

## Backend setup

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env  # macOS / Linux
```

Set `DATABASE_URL`. In production, `ADMIN_PASSWORD` must be ≥16 characters and `SESSION_SECRET` ≥32 characters. Defaults such as `changeme` are rejected. `npm run prisma:seed` **refuses to run** when `NODE_ENV=production` (it deletes catalog data).

```bash
npm install
npx prisma migrate deploy
npm run prisma:generate
npm run prisma:seed
npm run dev
```

In a second terminal, start the price worker (required for refresh, alerts, snapshot compaction, and ISR revalidate):

```bash
cd backend
npm run worker
```

Health check: `GET http://localhost:4000/api/health` (HTTP 503 if the database is down). Worker heartbeat is included in that payload.

Prisma scripts:

- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run prisma:studio`

## Frontend setup

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

The Next.js app proxies `/api/*` and `/go/:offerId` to the Express origin (`API_ORIGIN`). Browser requests stay first-party so the `ah_session` cookie works in production on one domain.

Admin: http://localhost:3000/admin/login

## Environment variables

Backend (`backend/.env.example`):

- `NODE_ENV` — `development` \| `test` \| `production`
- `PORT` — API port (default `4000`)
- `DATABASE_URL` — PostgreSQL connection string
- `CORS_ORIGIN` — frontend origin (still used if you call the API cross-origin)
- `ADMIN_PASSWORD` — required; strong value required in production
- `SESSION_SECRET` — HMAC key; ≥32 characters in production
- `AMAZON_ASSOCIATE_TAG` — optional default Amazon tag
- `TRUST_PROXY` — local `0`. Production **behind nginx/Caddy: `1`** (one reverse-proxy hop). Rate limits use Express `req.ip`. Do not blindly raise this; only trust hops that overwrite `X-Forwarded-For`.
- `SITE_URL` — public site URL (worker ISR + alert links). **Required https (not localhost) in production.**
- `REVALIDATE_SECRET` — shared with the frontend; worker sends `Authorization: Bearer` to `POST /admin/revalidate`. **Required, ≥32 characters in production.**
- `PRICE_HISTORY_PUBLIC` — keep `false` until counsel confirms public Amazon-derived charts
- `AMAZON_CREATORS_CREDENTIAL_ID` / `AMAZON_CREATORS_CREDENTIAL_SECRET` — optional; V1 works with tagged `/go` links if unset

Frontend (`frontend/.env.example`):

- `API_ORIGIN` — Express origin used by Next rewrites and server fetches
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for metadata/sitemap. **Must be public https in production** (`next build` / `next start` reject localhost).
- `NEXT_PUBLIC_CONTACT_EMAIL` — contact page mailto (omit until you have a real inbox)
- `REVALIDATE_SECRET` — same value as the backend; required for worker ISR refresh

## Architecture

- **Products** are editorial pages (score, pros/cons, SEO). Monetization lives on **Offers** belonging to **Merchants**.
- Public APIs never include affiliate URLs. Outbound clicks go through `GET /go/:offerId` (302) after a click row is stored.
- Guides can be `ARTICLE` (`/guides/[slug]`) or `BEST_OF` (`/best/[slug]`). Comparisons are `/compare/[slug]`. Index pages: `/guides`, `/best`, `/compare`.
- Slugs do not change when a title is edited. Intentional slug edits write `slug_redirects`.
- Our Score is editorial (0–10). It is not an Amazon or customer rating and is not emitted as `AggregateRating`.
- Admin **Ops** (`/admin/ops`) shows job depth, stale/failed offers, worker heartbeat, and snapshot compaction (keep one point per offer per UTC day after 90 days).

## Testing

```bash
cd backend
npm test
```

CI starts Postgres 16, runs `prisma migrate deploy`, then unit tests plus a health smoke test (`CI=true`). Local `npm test` skips the health smoke unless `CI=true`.

## Production notes

Serve Next and the API on **one hostname** (Caddy/nginx `/api` and `/go` proxy, or equivalent rewrites). The `ah_session` cookie is `HttpOnly`, `SameSite=lax`, and `Secure` when `NODE_ENV=production`. Split API/frontend hosts will break admin login.

```bash
# After npm run build in each app:
cd backend && NODE_ENV=production npm start          # node dist/index.js
cd backend && NODE_ENV=production npm run start:worker  # node dist/worker.js
cd frontend && npm run start
```

Do not use `npm run worker` (`tsx`) in production — `tsx` is a devDependency. `npm run prisma:seed` is blocked in production.

Production startup **fails** if `ADMIN_PASSWORD` / `SESSION_SECRET` / `SITE_URL` / `CORS_ORIGIN` / `REVALIDATE_SECRET` are missing, localhost, http, or weak. Amazon Creators credentials stay optional. Price-alert mail warns (does not fail) if both `ALERT_FROM_EMAIL` and `RESEND_API_KEY` are empty; setting only one of them fails.

- Set `TRUST_PROXY=1` behind one reverse proxy so login/`/go`/alert rate limits see the client IP.
- Run `prisma migrate deploy` on release.
- Rotate `SESSION_SECRET` to invalidate all admin sessions.
- Do not index `/admin`.
- Keep `PRICE_HISTORY_PUBLIC=false` until legal review.

### Backups (hosting/database layer)

**Backup must be configured at the hosting/database layer.** This repository does not run PostgreSQL backups.

Before launch:

1. Enable **daily** backups on the Postgres host (managed snapshot, or `pg_dump` from a scheduler that reads `DATABASE_URL` from the environment — never hardcode credentials).
2. Keep at least **7 days** of retention (30 days if the catalog is hard to recreate).
3. Practice restore **once** on a throwaway database before going live.

Restore outline (provider tools differ; this is the generic dump path):

```bash
# Backup (run where psql/pg_dump can reach production Postgres)
pg_dump "$DATABASE_URL" --format=custom --file=affiliate-$(date -u +%Y%m%d).dump

# Restore onto an empty database (destroys target data)
pg_restore --clean --if-exists --dbname="$DATABASE_URL" affiliate-YYYYMMDD.dump
npx prisma migrate deploy
```

Confirm after restore: `GET /api/health` returns 200, admin login works, a product page loads. If you have never restored a copy, treat backups as untested.
