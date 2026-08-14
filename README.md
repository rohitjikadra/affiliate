# AffiliateHub

Affiliate product discovery platform. This repository currently contains the **project foundation only**: a Next.js frontend, an Express API, Prisma + PostgreSQL, and a sample homepage. Marketplace APIs and authentication are intentionally not included yet.

## Architecture

```
affiliate/
  frontend/   Next.js + TypeScript + Tailwind CSS
  backend/    Node.js + Express + TypeScript + Prisma
```

| App | URL | Scripts |
| --- | --- | --- |
| Frontend | http://localhost:3000 | `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck` |
| Backend | http://localhost:4000 | `npm run dev`, `npm run build`, `npm run start`, `npm run typecheck` |

## Prerequisites

- Node.js 22+
- npm 10+
- PostgreSQL 14+

## Backend setup

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env  # macOS / Linux
```

Set `DATABASE_URL` in `backend/.env` to your PostgreSQL connection string.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Health check:

```bash
GET http://localhost:4000/api/health
```

Prisma scripts:

- `npm run prisma:generate` — generate the Prisma Client
- `npm run prisma:migrate` — run database migrations
- `npm run prisma:studio` — open Prisma Studio

## Frontend setup

```bash
cd frontend
copy .env.example .env.local   # Windows
# cp .env.example .env.local  # macOS / Linux
npm install
npm run dev
```

The homepage includes a search bar, category grid, and featured products from local mock data. Affiliate network integrations are not wired yet.

## Environment variables

Backend (`backend/.env.example`):

- `NODE_ENV` — `development` \| `test` \| `production`
- `PORT` — API port (default `4000`)
- `DATABASE_URL` — PostgreSQL connection string
- `CORS_ORIGIN` — allowed frontend origin

Frontend (`frontend/.env.example`):

- `NEXT_PUBLIC_API_URL` — backend base URL
