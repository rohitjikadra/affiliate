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
| Worker | (second Node process) | `npm run worker` from `backend/` |

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

Set `DATABASE_URL`. In production, `ADMIN_PASSWORD` must be ≥16 characters and `SESSION_SECRET` ≥32 characters. Defaults such as `changeme` are rejected.

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
- `TRUST_PROXY` — set to `1` behind a reverse proxy
- `SITE_URL` — public site URL (used by the worker to call on-demand ISR)
- `REVALIDATE_SECRET` — shared with the frontend; worker sends `Authorization: Bearer` to `POST /admin/revalidate`
- `PRICE_HISTORY_PUBLIC` — keep `false` until counsel confirms public Amazon-derived charts
- `AMAZON_CREATORS_CREDENTIAL_ID` / `AMAZON_CREATORS_CREDENTIAL_SECRET` — optional; V1 works with tagged `/go` links if unset

Frontend (`frontend/.env.example`):

- `API_ORIGIN` — Express origin used by Next rewrites and server fetches
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for metadata/sitemap
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

- Serve Next and the API on one hostname (Vercel rewrites or Caddy/nginx `/api` proxy).
- Run `npm run worker` as a second process (or supervisor). Do not fetch Amazon on page requests.
- Set the same `REVALIDATE_SECRET` on Next and the API so successful price fetches can purge ISR pages.
- Run `prisma migrate deploy` on release.
- Rotate `SESSION_SECRET` to invalidate all admin sessions.
- Back up managed Postgres with the host's daily snapshots.
- Do not index `/admin`.
- Keep `PRICE_HISTORY_PUBLIC=false` until legal review.
