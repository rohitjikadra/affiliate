# AffiliateHub

Affiliate product discovery + comparison platform. Next.js shop/CMS talks to an Express API through same-origin `/api` rewrites. Amazon is one merchant among many.

```
Browser  →  Next.js :3000
              /api/*  and  /go/:offerId  →  Express :4000
              Prisma  →  PostgreSQL
```

## Apps

| App | URL | Scripts |
| --- | --- | --- |
| Frontend | http://localhost:3000 | `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck` |
| Backend | http://localhost:4000 | `npm run dev`, `npm run build`, `npm run start`, `npm run typecheck`, `npm test` |

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

Health check: `GET http://localhost:4000/api/health` (HTTP 503 if the database is down).

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
- `SITE_URL` — public site URL

Frontend (`frontend/.env.example`):

- `API_ORIGIN` — Express origin used by Next rewrites and server fetches
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for metadata/sitemap
- `NEXT_PUBLIC_CONTACT_EMAIL` — contact page mailto (omit until you have a real inbox)

## Architecture

- **Products** are editorial pages (score, pros/cons, SEO). Monetization lives on **Offers** belonging to **Merchants**.
- Public APIs never include affiliate URLs. Outbound clicks go through `GET /go/:offerId` (302) after a click row is stored.
- Guides can be `ARTICLE` (`/guides/[slug]`) or `BEST_OF` (`/best/[slug]`). Comparisons are `/compare/[slug]`.
- Slugs do not change when a title is edited. Intentional slug edits write `slug_redirects`.
- Our Score is editorial (0–10). It is not an Amazon or customer rating and is not emitted as `AggregateRating`.

## Testing

```bash
cd backend
npm test
```

Covers env validation, HMAC sessions, serializer URL hiding, pagination, Amazon tag adapter, and login/logout.

## Production notes

- Serve Next and the API on one hostname (Vercel rewrites or Caddy/nginx `/api` proxy).
- Run `prisma migrate deploy` on release.
- Rotate `SESSION_SECRET` to invalidate all admin sessions.
- Back up managed Postgres with the host's daily snapshots.
- Do not index `/admin`.
