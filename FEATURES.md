# My Pasand Shop — complete feature inventory (for ChatGPT / LLM context)

Use this file as the **source of truth for what the project already does**. Do not invent Flipkart adapters, scraping, Redis, browser extensions, or public Amazon price-history charts.

**Brand name in code:** `SITE_NAME` = `My Pasand Shop` (`frontend/src/lib/site.ts`)  
**Tagline:** `Kitchen appliance price comparison for Indian homes.`  
**Cookie:** `ah_session` (HMAC admin session; HttpOnly)  
**Repo root:** two apps — `frontend/` (Next.js 16 App Router) and `backend/` (Express 5 + Prisma 7 + PostgreSQL)

---

## 1. What this product is

Kitchen-appliance **shopping intelligence** for Indian homes:

- Editorial product pages (score, specs, pros/cons, “best for”, “who should avoid”)
- Merchant **Offers** as the commerce source of truth (price, stock, affiliate URL)
- Compare / best-of / guides
- Freshness labels on prices
- Optional email price alerts
- Amazon Associates monetization via tracked `/go/:offerId` redirects
- Admin CMS + ops + ASIN import to **Draft** (human publish)

It is **not** BuyHatke. Do not copy BuyHatke UI or scraping. Do not scrape Amazon. Do not use PA-API 5. Official Amazon path is **Creators API** or a disabled stub.

---

## 2. Hard constraints (must never violate)

1. **No Amazon scraping.** No HTML fetch of amazon.in product pages.
2. **No PA-API 5.** Only Amazon Creators API, or adapter `enabled: false`.
3. **Offer is source of truth** for price / stock / affiliate URL. Do not dual-write commerce onto `Product.price` / `Product.affiliateUrl` as the live source. Those Product columns still exist (legacy) but list/PDP **computed** price comes from offers (best fresh in-stock).
4. **Imports never auto-publish.** New ASINs create `Product.status = DRAFT` and `isActive = false`.
5. **No Redis, Kafka, Flipkart adapter, browser extension, AI auto-publish, WhatsApp, social login, saved products, deal engine.**
6. **Public Amazon-style price history charts are legally gated.** Runtime flag `PRICE_HISTORY_PUBLIC` (default **false**). Do not turn it on without Indian counsel. Snapshots still stored for ops/alerts.
7. **V1 must work without Creators credentials:** tagged `https://www.amazon.in/dp/{ASIN}?tag=` + manual prices + `/go` clicks. Worker idles with `fetchStatus=NEVER` if adapter disabled.
8. **Worker is a second Node process** (`npm run worker` in `backend/`). Page requests never call Amazon live.
9. **Public APIs never return affiliate URLs.** Checkout is `GET /go/:offerId` → 302 after click row.
10. **Our Score is editorial (0–10).** Not a customer or Amazon rating. JSON-LD must **not** emit `AggregateRating`.
11. **JSON-LD Product offers/price only if freshness is `fresh`.** Otherwise omit price (avoid Google stale-price issues).
12. **Identifier matching is exact, not ML/fuzzy title merge.**

---

## 3. Architecture

```
Browser
  → Next.js :3000  (shop + admin CMS, ISR revalidate=120)
       /api/*  rewrite  → Express :4000
       /go/:offerId rewrite → Express /api/go/:offerId
  → Express :4000  (Prisma → PostgreSQL)
  → Worker process  (same Postgres Job table, FOR UPDATE SKIP LOCKED)
```

- **Frontend:** Next.js 16, React 19, Tailwind 4, App Router. Same-origin `/api` so `ah_session` works.
- **Backend:** Express 5, Zod, Helmet, cookie HMAC session, Prisma 7 (`@prisma/adapter-pg`).
- **DB:** PostgreSQL 16 (`docker-compose.yml` service `postgres`; local native Postgres also used).
- **Jobs:** table `jobs`, claim with `SKIP LOCKED`. Tick every **30 seconds**.
- **ISR:** shop pages `export const revalidate = 120`. On-demand: `POST /admin/revalidate` (Next route). Admin cookie **or** `Authorization: Bearer REVALIDATE_SECRET` (worker). Always also revalidates `/`, `/products`, `/sitemap.xml`. Allowed path prefixes: `/`, `/products`, `/guides`, `/best`, `/compare`, `/categories`, `/sitemap.xml`.

---

## 4. Domain model (Prisma)

### Core

| Entity | Role |
| --- | --- |
| **Product** | Editorial canonical item. Public if `isActive && status === PUBLISHED`. |
| **Offer** | One merchant listing. Holds `price`, `originalPrice`, `currency` (INR), `affiliateUrl`, `productUrl`, `externalId` (ASIN), stock/availability, fetch fields. |
| **Merchant** | Amazon etc. `integrationKey` e.g. `AMAZON_IN`, `defaultTag`, `hostAllowlist`, `fetchEnabled`. |
| **ProductIdentifier** | Exact-match IDs. Partial unique in SQL: `ASIN/GTIN/EAN/UPC` globally unique; `SKU/MERCHANT_ID/MPN` unique per merchant. Types: `ASIN, GTIN, EAN, UPC, MPN, SKU, MERCHANT_ID`. |
| **Category** | e.g. seed `kitchen-appliances`. |
| **Guide** | `ARTICLE` → `/guides/[slug]`; `BEST_OF` → `/best/[slug]`. `published` flag. |
| **GuideProduct** | Ranked products on a guide. Badges: `BEST_OVERALL, BEST_BUDGET, BEST_PREMIUM, BEST_FOR_BEGINNERS, RELATED`. |
| **Comparison** | `/compare/[slug]`. Optional `winnerProductId`. |
| **ComparisonItem** | Products in a comparison table. |
| **AffiliateClick** | Outbound click: product, offer, merchant, UTM, referrer, ipHash, device, landingPath. |
| **PageView** | Analytics: path, entityType, entityId, UTM. |
| **PriceSnapshot** | First-party observation. Insert only if price/availability/stock changed **or** last snapshot older than **6 hours**. Source: `MANUAL, ADMIN, AMAZON_CREATORS, WORKER`. |
| **PriceEvent** | `DROP, RISE, NEW_LOW, RETURN_TO_LOW, UNAVAILABLE, BACK_IN_STOCK`. |
| **PriceAlert** | Email-only. Types `TARGET_PRICE, PERCENT_DROP, NEW_LOW`. Verify + unsubscribe token **hashes** (SHA-256). No passwords. |
| **Job** | Queue. Types: `PRICE_REFRESH, PRODUCT_IMPORT, ALERT_DISPATCH, SNAPSHOT_COMPACT, REVALIDATE`. Status: `PENDING, RUNNING, SUCCEEDED, FAILED, DEAD`. |
| **WorkerHeartbeat** | Health: last seen. Worker “up” if heartbeat &lt; 2 minutes old. |
| **SlugRedirect** | 308 when slug changes. Unique `(entityType, fromSlug)`. |

### Product fields (editorial + leftover commerce)

Editorial: `title, slug, description, features, pros, cons, bestFor, faq, brand, modelNumber, whoShouldAvoid, warranty, specs` (JSON array `{label,value}` max 20), `scoreBreakdown` (JSON `{label,score}` max 12), `images` (max 12 http(s) URLs), `imageUrl`, `ourScore` (0–10), `seoTitle` (max 120), `seoDescription` (max 300), `featured`, `isActive`, `status` (`DRAFT, REVIEW, PUBLISHED, ARCHIVED`), `publishedAt`, `categoryId`.

Legacy (do not treat as source of truth): `price, originalPrice, affiliateUrl, source (MANUAL\|AMAZON\|FLIPKART), sourceId`.

### Offer unique

`@@unique([productId, merchantId, externalId])`  
There is **no** Prisma unique on `(merchantId, externalId)` because `externalId` defaults to `""`. SQL has a partial unique `offers_merchant_id_external_id_uidx` on `(merchant_id, external_id) WHERE external_id <> ''`. Import matching is exact-identifier first (see Import).

### Offer fetch

`fetchStatus`: `NEVER, QUEUED, SUCCESS, RATE_LIMITED, ERROR, UNAVAILABLE, INVALID`  
`availability`: `IN_STOCK, OUT_OF_STOCK, UNKNOWN`  
Backoff: success next fetch **45–60 min** random. Failure exponential from 5 min, cap 24h. Pause after **8** consecutive failures (`nextFetchAt = null`).

---

## 5. Pricing / freshness rules

**Best price** (`selectBestOffer`): cheapest **in-stock** offer with a valid price &gt; 0, merchant active, and checked within **24 hours** (or `fetchStatus NEVER` / never checked still eligible so manual seed offers work). Does **not** use `isPrimary`, Amazon, or commission.

**Recommended** (`isPrimary`): editorial flag only. Admin label is “Recommended”. First offer on a newly created product is recommended (first-offer policy), including Amazon imports — not because the merchant is Amazon. Attaching another merchant’s offer does not set Recommended.

**Buyable / checkout fallback** (`selectCheckoutOffer`): use Best Price when one exists; otherwise the first in-stock active-merchant offer (prefer Recommended). Never labeled “Best Price”.

**Freshness** from `lastSuccessfulFetchAt ?? lastCheckedAt`:

| Level | Age |
| --- | --- |
| `fresh` | ≤ 2 hours |
| `aging` | ≤ 24 hours |
| `stale` | &gt; 24 hours |
| `unknown` | no timestamp |

Labels like “Checked 12 minutes ago”. PDP shows `FreshnessBadge`. List cards too.

**List/PDP displayed price** = best-offer price (serializer), not Product.price.

**Currency:** INR only for Amazon adapter validation.

---

## 6. Public shop (Next.js)

Visual identity: forest green (`#1f5c4d`), clay/orange CTA (`#c45c26`), mist background. Display serif headings. **Not** Amazon orange/navy clone.

ISR 120s on shop routes.

### Header / footer

- Nav: Products, Guides, Compare, Kitchen (`/categories/${SITE_CATEGORY_SLUG}`) — copy from `frontend/src/lib/site.ts`
- Header search → `/products?q=`
- Generic affiliate disclosure strip + link to `/affiliate-disclosure` (not Amazon Associates by default)
- Amazon Associates wording appears on `/affiliate-disclosure` and next to Amazon offers only
- Footer: products, guides, compare, best, kitchen, about, contact, privacy, affiliate disclosure

### Routes

| Path | Feature |
| --- | --- |
| `/` | Homepage: hero search + chips (mixer, air fryer, induction, kettle, blender) → product grid with photos first → visual best-of cards (max 4, product thumbs) → comparison cards with thumbs → extra trending/drops only if not already in the shop grid |
| `/products` | Catalog. Search `q`, pagination. Search matches **title, description, brand, modelNumber, identifier value**. Sort optional `trending` (pageviews) or `drops` (real snapshot drops). |
| `/products/[slug]` | PDP: gallery, brand/model, Our Score + breakdown, best price, freshness, Amazon price disclaimer if Amazon merchant, warranty, best for, **who should avoid**, description, features, specs, pros/cons, FAQ, offer list + Buy Now, related products, related guides/comparisons, **price alert form**, **price history section** (empty/gated if flag off). JSON-LD Product + Breadcrumb + optional FAQ. 404 if not PUBLISHED+active. |
| `/categories/[slug]` | Category product grid + pagination |
| `/guides` | List ARTICLE + BEST_OF |
| `/guides/[slug]` | Article. BEST_OF redirects to `/best/[slug]`. Breadcrumb JSON-LD. |
| `/best` | Index of BEST_OF guides |
| `/best/[slug]` | Best-of list with badges, notes, who-should-avoid, Buy Now, ProductCard. Breadcrumb JSON-LD Home / Best of / title |
| `/compare` | Index of comparisons |
| `/compare/[slug]` | Table: Our Score, Price, Best for, **Who should avoid**, Offer/Buy Now. Winner callout. Methodology. Breadcrumb JSON-LD |
| `/about` | About copy |
| `/contact` | Mailto form if `NEXT_PUBLIC_CONTACT_EMAIL` set; otherwise message to set email |
| `/privacy` | Privacy including **price-alert email** (store email, purpose, unsubscribe, no extra PII, DPDP-oriented) |
| `/affiliate-disclosure` | Merchant-neutral affiliate disclosure; Amazon Associates section for Amazon |
| `/alerts/verify?token=` | Confirm alert email |
| `/alerts/unsubscribe?token=` | Unsubscribe |
| `/sitemap.xml` | Products, categories, guides (article vs best), comparisons, plus `/`, `/products`, `/guides`, `/best`, `/compare`, about, disclosure |
| `/robots.txt` | Allow `/`; disallow `/admin`, `/api`, `/go`; sitemap URL |

### Buy Now / clicks

- `BuyNowButton` uses `bestOfferId` or `primaryOfferId`, then `GET /go/{offerId}` (rewrite to API).
- Sticky CTA on PDP mobile.
- `AffiliateNotice` near CTAs (generic commission wording).
- `AmazonPriceDisclaimer` and Amazon Associates wording only next to Amazon offers.
- `Merchant.disclosure` rendered on PDP / offer / comparison / best-of surfaces when set.

### Price alerts (PDP)

- Email + type: target price / percent drop / new low.
- Product-level alerts evaluate the product’s current **best eligible price**. A non-best merchant price change does not fire them.
- Optional `offerId` is kept for future merchant-specific alerts (those still use that offer’s price/events).
- Rate limit: **8 / 15 min / IP**.
- Create always succeeds structurally; email send skipped if `RESEND_API_KEY` / `ALERT_FROM_EMAIL` missing (log `email_skipped`).
- Must **verify** via emailed link before dispatch.
- Unsubscribe token on every mail.
- No user accounts.

### Price history (PDP)

- `GET /api/products/:id/price-history?range=7d\|30d\|90d`
- If `PRICE_HISTORY_PUBLIC=false`: `{ enabled: false, points: [], stats: null }` and UI empty state (“We’ll chart prices after…” / gated).
- If true: daily **lowest** point across that product’s offers (not a public per-merchant chart), downsample max **90** points, label **“Prices recorded on this site”** — never Amazon official history.
- Do not invent seed history.

### Search

Public `q` is Postgres `contains` (insensitive) on title, description, brand, modelNumber, identifier value. No Elasticsearch, no autocomplete API.

### Page views

Client `TrackPageView` POSTs `/api/pageviews` (60/min). Used for trending sort.

### Slug moves

API 308 + `redirectSlug` → Next `handleMoved` redirects to new slug under the same prefix.

---

## 7. Admin CMS (`/admin`)

- Login: `/admin/login` password-only (`ADMIN_PASSWORD`). Cookie `ah_session`. Production: password ≥16, not common; `SESSION_SECRET` ≥32, not default.
- Login rate limit: **5 / 15 min**.
- `/admin` redirects to `/admin/products`.
- Layout `force-dynamic`. `X-Robots-Tag: noindex` on `/admin/*`.
- Nav: Products, Categories, Guides, Comparisons, Merchants, Analytics, Alerts, Ops, Import.

### Products

- List with search, status badge (DRAFT/REVIEW/PUBLISHED/ARCHIVED), Publish, Activate/Deactivate, Edit, Delete, View.
- Create/edit form: all editorial fields including **Who should avoid**, catalog status select, featured, active, images (newline URLs, max 12), specs, score breakdown, Amazon tag warning if URL missing tag.
- Manual create default status **PUBLISHED**.
- Edit: **Publish to shop** if not already PUBLISHED (needs ≥1 offer with safe http(s) URL).
- Nested **Offers editor** per product (CRUD). Labels: Merchant, Offer, Recommended. Price changes can write snapshots.
- After save: `revalidateShop` for product paths.

### Merchants

Form fields already on the API: name, slug, kind, network, website, `defaultTag`, `disclosure`, `integrationKey`, `fetchEnabled`, `hostAllowlist` (one host per line). Empty `hostAllowlist` **blocks** `/go`. Public APIs do not return tag/allowlist/integration key.

### Import (`/admin/import`)

- Paste up to **20** 10-char ASINs (comma/space/newline). UI title: **Amazon ASIN Import** (Amazon is the only live adapter; no merchant picker).
- Optional **SearchItems** keywords (Creators API). If API off: message + paste still works.
- Optional category.
- **Import as drafts** — never publishes.
- Match (exact only, no fuzzy/ML): (1) GTIN/EAN/UPC → same Product; (2) trusted merchant id (Amazon ASIN is global; other adapters use merchant-scoped `MERCHANT_ID`); (3) existing offer `(merchantId, externalId)`; (4) else create DRAFT. Conflicting product IDs → `review`, no auto-merge. `{ asins }` still works for Amazon.
- GetItems batched **10 ASINs/request**.
- No Product.price write. No fake Amazon image if lookup misses (`imageUrl` null).
- After create: enqueue `PRICE_REFRESH`.

### Ops (`/admin/ops`)

Cards: pending/dead jobs, stale/failed/queued offers, verified alerts, snapshot count, price events last 24h, worker heartbeat.  
Offer table filters stale/failed/queued + **Refresh now**. Jobs + **Retry** for DEAD/FAILED. **Compact old snapshots** (retain 90 days, one snapshot per offer per UTC day).

### Alerts (`/admin/alerts`)

Latest alerts: email, product, type, value, verified/pending/unsub, last triggered. Token hashes **not** shown.

### Analytics (`/admin/stats`)

Clicks 7d/30d/all, page views, CTR by product, by merchant, top pages, UTM sources, recent clicks. **No Amazon conversion data.**

### Other CRUD

Categories, merchants (`defaultTag`, `fetchEnabled`, `integrationKey`, host allowlist), guides (ARTICLE vs BEST_OF), comparisons (winner, items).

### Config

`GET /api/admin/config`: `amazonAssociateTag`, `creatorsConfigured`, `priceHistoryPublic`.

---

## 8. Worker jobs

Process: `backend/src/worker.ts`. Interval 30s.

Each tick: reclaim stale RUNNING jobs (lock &gt; 5 min) → enqueue due offer refreshes (up to 50, only `fetchEnabled` merchants, PUBLISHED+active products, `nextFetchAt` due, not INVALID/QUEUED) → enqueue `SNAPSHOT_COMPACT` if none pending/running and last success &gt; 24h → claim one job SKIP LOCKED.

| Job | Payload | Action |
| --- | --- | --- |
| `PRICE_REFRESH` | `{ offerId }` | Creators GetItems (or stub). Validate ASIN + INR + price&gt;0. Update offer. Snapshot if changed. PriceEvents. If events, `ALERT_DISPATCH`. Then `REVALIDATE` paths `/products/{slug}` and `/products`. |
| `ALERT_DISPATCH` | `{ offerId }` | Email verified active **product-level** alerts only if this offer is the current best eligible price; offer-scoped alerts (`offerId` set) still match that merchant offer. |
| `SNAPSHOT_COMPACT` | `{}` | Delete extra snapshots older than 90 days; keep one per offer per UTC day. |
| `REVALIDATE` | `{ path }` and/or `{ paths: string[] }` | POST Next `/admin/revalidate` with Bearer secret. No-op if `SITE_URL` or `REVALIDATE_SECRET` missing. |
| `PRODUCT_IMPORT` | `{ merchantId, externalIds, asins?, categoryId }` | Same as HTTP `importProducts` (HTTP import is **sync** for admin UX; job exists for queue). `{ asins }` still works for Amazon. |

Adapter key: `AMAZON_IN` only. `getAdapter("AMAZON_IN", partnerTag)`. Disabled if credential id/secret empty → `AdapterDisabledError` / `enabled: false`.

Creators endpoints (code): token `https://api.amazon.co.uk/auth/o2/token`; GetItems/SearchItems `https://creatorsapi.amazon/catalog/v1/...`; marketplace default `www.amazon.in`; fetch timeout 8s; GetItems max 10 ASINs.

---

## 9. HTTP API (Express, prefix `/api`)

JSON envelope `{ data, meta?, error? }`. Errors: codes like `VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, RATE_LIMITED`.

### Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | 200 ok / 503 degraded. Checks DB + worker heartbeat. |
| GET | `/products` | Query: `q, category, featured, includeInactive` (admin), `sort=trending\|drops`, `page, limit` (default 24, max 100). Public filter: `isActive && PUBLISHED`. |
| GET | `/products/:idOrSlug` | Full product + offers (no affiliate URLs unless admin session). |
| GET | `/products/:id/related` | Related products |
| GET | `/products/:id/price-history` | Gated; see §6 |
| POST | `/products/:slug/go` | Legacy product-level go (rate limited); prefer offer go |
| GET | `/go/:offerId` | **Main checkout.** Validate http(s)+allowlist, inject Amazon tag, write click, 302. Rate 30/min. |
| GET | `/categories` | List |
| GET | `/categories/:idOrSlug` | |
| GET | `/guides` | `kind, category, includeUnpublished, page, limit` |
| GET | `/guides/:idOrSlug` | |
| GET | `/comparisons` | |
| GET | `/comparisons/:idOrSlug` | |
| GET | `/merchants` | Public list; admin sees more |
| GET | `/merchants/:id` | |
| POST | `/pageviews` | 60/min |
| POST | `/alerts` | Create; 8/15min |
| GET | `/alerts/verify?token=` | |
| GET | `/alerts/unsubscribe?token=` | |
| GET | `/sitemap` | Payload for Next sitemap |
| POST | `/auth/login` | `{ password }` |
| POST | `/auth/logout` | |
| GET | `/auth/me` | Admin |

### Admin (cookie)

| Method | Path |
| --- | --- |
| GET | `/admin/config` |
| CRUD | `/products`, PATCH `/:id/status` |
| CRUD | `/products/:productId/offers` |
| CRUD | `/categories`, `/guides`, `/comparisons`, `/merchants` |
| GET | `/admin/stats/clicks` |
| GET | `/admin/ops/overview` |
| GET | `/admin/ops/offers?freshness=stale\|failed\|queued` |
| POST | `/admin/ops/offers/:id/refresh` → 202 |
| GET | `/admin/ops/jobs` |
| POST | `/admin/ops/jobs/:id/retry` |
| POST | `/admin/ops/snapshots/compact` |
| GET | `/admin/ops/alerts` |
| GET | `/admin/ops/products/search?q=` (min 2, max 80) |
| POST | `/admin/ops/products/import` `{ asins[1..20], categoryId? }` → 201 |
| POST | `/admin/ops/products/:id/publish` |

Next also: `POST /admin/revalidate` `{ paths: string[] }` — **not** Express; Next Route Handler.

---

## 10. Security / URLs

- `isSafeHttpUrl`: http/https only.
- Private/localhost hosts blocked for merchant/go URLs (`isPrivateHostname`). Empty `hostAllowlist` fails closed (no `/go`). Non-empty list must match host.
- Amazon tag injection: `Merchant.defaultTag` or `AMAZON_ASSOCIATE_TAG`; `applyAmazonTag`.
- Do not log full Amazon PAC responses at info.
- Alert tokens hashed; no email enumeration beyond generic success.
- Helmet on API. Frontend headers: nosniff, referrer-policy, SAMEORIGIN frame.
- `TRUST_PROXY` for Express behind proxy.

---

## 11. Environment

### Backend

`NODE_ENV, PORT, DATABASE_URL, CORS_ORIGIN, ADMIN_PASSWORD, SESSION_SECRET, AMAZON_ASSOCIATE_TAG, TRUST_PROXY, SITE_URL, AMAZON_CREATORS_CREDENTIAL_ID, AMAZON_CREATORS_CREDENTIAL_SECRET, AMAZON_CREATORS_MARKETPLACE, PRICE_HISTORY_PUBLIC, ALERT_FROM_EMAIL, RESEND_API_KEY, REVALIDATE_SECRET`

### Frontend

`API_ORIGIN` (or `NEXT_PUBLIC_API_URL`), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `REVALIDATE_SECRET` (same as backend)

---

## 12. Seed data (`backend/prisma/seed.ts`)

- Merchant: Amazon (`slug: amazon`, `integrationKey AMAZON_IN`, host allowlist amazon.in / amazon.com / amzn.in / amzn.to).
- Category: `kitchen-appliances`.
- ~10–11 kitchen products (Prestige/Bajaj/Preethi mixer, Philips/Pigeon air fryer, Prestige/Pigeon induction, Prestige kettle, Philips hand blender, Prestige sandwich toaster) with editorial copy, `whoShouldAvoid`, ASINs as `sourceId` / identifiers.
- 6 BEST_OF guides: mixer India, mixer under ₹5k, air fryers under ₹8k, induction, kettles, hand blenders.
- 5 comparisons: 750w vs 1000w mixie, mixie vs blender, air fryer vs OTG, 2-jar vs 3-jar, SS vs plastic jar.
- Offers may start with null prices until worker/manual fill.

---

## 13. CI / tests

`.github/workflows/ci.yml`:

- Backend: Node 22, **Postgres 16 service**, `prisma migrate deploy`, `npm run typecheck`, `npm test`.
- Frontend: `npm ci` + typecheck.
- Health integration test runs only when `CI=true` (expects DB up).

Backend Vitest: env, session, serializers, pagination, Amazon tag/adapter, import matching, snapshots, best-price, refresh backoff, alerts, history helpers, login, URL allowlist, etc.

---

## 14. Naming (do not invent a second vocabulary)

Use: `importAsins` / `importProducts`, `publishProduct`, `searchCatalog`, `parseAsins` (Amazon adapter), `chunkIds`, `decideImportAction` (`create` \| `attach-offer` \| `refresh-offer`), `PRODUCT_IMPORT`, `ah_session`, `getAdapter("AMAZON_IN")`, `enqueueJob`, `AppError`, frontend `request()` in `frontend/src/lib/api.ts`, `SITE_NAME` / `SITE_TAGLINE` / `SITE_HEADLINE` / `SITE_CATEGORY_SLUG` in `frontend/src/lib/site.ts`. Public `store` is the best-offer merchant name, not `Product.source`.

---

## 15. Explicitly out of scope (do not add unless asked)

Flipkart/Croma adapters, deal labels/coupons, autocomplete, saved products, social login, Redis, Kafka, browser extension, mobile app, AI auto-publish, WhatsApp/Telegram, B2B feed, programmatic thousands of `/best` URLs, public Amazon PAC history charts, admin merge-tool (P1 leftover, identifier match is enough), Dockerfiles for app/worker (compose is Postgres-only).

---

## 16. Known schema/product gaps (honest)

- Global unique `(merchantId, externalId)` **not** in Prisma unique because `externalId` defaults to `""`. SQL already has a partial unique where `external_id <> ''`. Do not force a Prisma unique without a data cleanup.
- `Product.price` / `affiliateUrl` / `source` / `sourceId` columns still exist. CMS still reads/writes them. Import/worker do not use them as live commerce. Public list/PDP price and store come from Offers.
- `Product.source` still includes unused `FLIPKART`. Import still sets `AMAZON` for Amazon adapter provenance (admin stats).
- `POST /products/:slug/go` still falls back to `Product.affiliateUrl` when there are no offers (backward compatible).
- Default import merchant and `searchCatalog` remain Amazon. Amazon is the only live adapter.
- Public price history stays product-level and gated; do not expose a per-merchant Amazon PAC chart.
- Creators API typically needs **10 qualifying Amazon Associates sales / 30 days**; until then stub + tagged links.
- Snapshot compaction keeps daily points after 90 days; does not delete all history.

---

## 17. How to run locally

```bash
# Postgres on :5432
cd backend && npx prisma migrate deploy && npm run dev
# second terminal
cd backend && npm run worker
# third
cd frontend && npm run dev
```

- Shop: http://localhost:3000  
- API: http://localhost:4000  
- Health: http://localhost:4000/api/health  
- Admin: http://localhost:3000/admin/login  

Worker required for refresh, alerts dispatch, compaction, ISR purge.
