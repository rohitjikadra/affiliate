-- CreateEnum
CREATE TYPE "MerchantKind" AS ENUM ('MARKETPLACE', 'DIRECT', 'NETWORK');
CREATE TYPE "GuideKind" AS ENUM ('ARTICLE', 'BEST_OF');
CREATE TYPE "GuideProductBadge" AS ENUM ('BEST_OVERALL', 'BEST_BUDGET', 'BEST_PREMIUM', 'BEST_FOR_BEGINNERS', 'RELATED');

-- AlterTable products
ALTER TABLE "products" ADD COLUMN "best_for" TEXT;
ALTER TABLE "products" ADD COLUMN "faq" TEXT;
ALTER TABLE "products" ADD COLUMN "our_score" DECIMAL(4,1);
ALTER TABLE "products" ADD COLUMN "seo_title" TEXT;
ALTER TABLE "products" ADD COLUMN "seo_description" TEXT;

UPDATE "products" SET "our_score" = ROUND(("rating" * 2), 1) WHERE "rating" IS NOT NULL AND "our_score" IS NULL;

-- AlterTable guides
ALTER TABLE "guides" ADD COLUMN "kind" "GuideKind" NOT NULL DEFAULT 'ARTICLE';
ALTER TABLE "guides" ADD COLUMN "methodology" TEXT;
ALTER TABLE "guides" ADD COLUMN "seo_title" TEXT;
ALTER TABLE "guides" ADD COLUMN "seo_description" TEXT;

ALTER TABLE "guides" DROP CONSTRAINT "guides_category_id_fkey";
ALTER TABLE "guides" ADD CONSTRAINT "guides_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "guides_kind_published_idx" ON "guides"("kind", "published");

-- CreateTable merchants
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website_url" TEXT,
    "kind" "MerchantKind" NOT NULL DEFAULT 'MARKETPLACE',
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "network" TEXT,
    "default_tag" TEXT,
    "disclosure" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "merchants_slug_key" ON "merchants"("slug");

-- CreateTable offers
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "merchant_id" TEXT NOT NULL,
    "title" TEXT,
    "price" DECIMAL(12,2),
    "original_price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "affiliate_url" TEXT NOT NULL,
    "external_id" TEXT NOT NULL DEFAULT '',
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offers_product_id_merchant_id_external_id_key" ON "offers"("product_id", "merchant_id", "external_id");
CREATE INDEX "offers_product_id_is_primary_idx" ON "offers"("product_id", "is_primary");
CREATE INDEX "offers_merchant_id_idx" ON "offers"("merchant_id");

ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable guide_products
CREATE TABLE "guide_products" (
    "id" TEXT NOT NULL,
    "guide_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "rank" INTEGER,
    "badge" "GuideProductBadge" NOT NULL DEFAULT 'RELATED',
    "notes" TEXT,

    CONSTRAINT "guide_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guide_products_guide_id_product_id_key" ON "guide_products"("guide_id", "product_id");
CREATE INDEX "guide_products_guide_id_rank_idx" ON "guide_products"("guide_id", "rank");

ALTER TABLE "guide_products" ADD CONSTRAINT "guide_products_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guide_products" ADD CONSTRAINT "guide_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable comparisons
CREATE TABLE "comparisons" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "winner_product_id" TEXT,
    "methodology" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparisons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comparisons_slug_key" ON "comparisons"("slug");
CREATE INDEX "comparisons_published_idx" ON "comparisons"("published");

ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_winner_product_id_fkey" FOREIGN KEY ("winner_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "comparison_items" (
    "id" TEXT NOT NULL,
    "comparison_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "comparison_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "comparison_items_comparison_id_product_id_key" ON "comparison_items"("comparison_id", "product_id");
CREATE INDEX "comparison_items_comparison_id_sort_order_idx" ON "comparison_items"("comparison_id", "sort_order");

ALTER TABLE "comparison_items" ADD CONSTRAINT "comparison_items_comparison_id_fkey" FOREIGN KEY ("comparison_id") REFERENCES "comparisons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comparison_items" ADD CONSTRAINT "comparison_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable affiliate_clicks
ALTER TABLE "affiliate_clicks" ADD COLUMN "offer_id" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "merchant_id" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "landing_path" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "ip_hash" TEXT;
ALTER TABLE "affiliate_clicks" ADD COLUMN "device" TEXT;

CREATE INDEX "affiliate_clicks_offer_id_idx" ON "affiliate_clicks"("offer_id");
CREATE INDEX "affiliate_clicks_merchant_id_idx" ON "affiliate_clicks"("merchant_id");

ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable page_views
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "page_views_created_at_idx" ON "page_views"("created_at");
CREATE INDEX "page_views_entity_type_entity_id_idx" ON "page_views"("entity_type", "entity_id");
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateTable price_snapshots
CREATE TABLE "price_snapshots" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_snapshots_offer_id_recorded_at_idx" ON "price_snapshots"("offer_id", "recorded_at");

ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable slug_redirects
CREATE TABLE "slug_redirects" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "from_slug" TEXT NOT NULL,
    "to_slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slug_redirects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "slug_redirects_entity_type_from_slug_key" ON "slug_redirects"("entity_type", "from_slug");
CREATE INDEX "slug_redirects_entity_type_to_slug_idx" ON "slug_redirects"("entity_type", "to_slug");

-- Backfill default merchants and offers from existing affiliate URLs
INSERT INTO "merchants" ("id", "slug", "name", "kind", "is_active", "network", "created_at", "updated_at")
VALUES
  ('merchant_amazon', 'amazon', 'Amazon', 'MARKETPLACE', true, 'AMAZON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('merchant_flipkart', 'flipkart', 'Flipkart', 'MARKETPLACE', true, 'FLIPKART', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "offers" (
  "id",
  "product_id",
  "merchant_id",
  "price",
  "original_price",
  "currency",
  "affiliate_url",
  "external_id",
  "in_stock",
  "is_primary",
  "last_checked_at",
  "created_at",
  "updated_at"
)
SELECT
  CONCAT('offer_', p."id"),
  p."id",
  CASE WHEN p."source" = 'FLIPKART' THEN 'merchant_flipkart' ELSE 'merchant_amazon' END,
  p."price",
  p."original_price",
  p."currency",
  p."affiliate_url",
  COALESCE(p."source_id", ''),
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "products" p
WHERE p."affiliate_url" IS NOT NULL AND p."affiliate_url" <> '';
