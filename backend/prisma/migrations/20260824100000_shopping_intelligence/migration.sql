-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "OfferFetchStatus" AS ENUM ('NEVER', 'QUEUED', 'SUCCESS', 'RATE_LIMITED', 'ERROR', 'UNAVAILABLE', 'INVALID');
CREATE TYPE "AvailabilityStatus" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'UNKNOWN');
CREATE TYPE "IdentifierType" AS ENUM ('ASIN', 'GTIN', 'EAN', 'UPC', 'MPN', 'SKU', 'MERCHANT_ID');
CREATE TYPE "JobType" AS ENUM ('PRICE_REFRESH', 'PRODUCT_IMPORT', 'ALERT_DISPATCH', 'SNAPSHOT_COMPACT', 'REVALIDATE');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD');
CREATE TYPE "PriceEventType" AS ENUM ('DROP', 'RISE', 'NEW_LOW', 'RETURN_TO_LOW', 'UNAVAILABLE', 'BACK_IN_STOCK');
CREATE TYPE "AlertType" AS ENUM ('TARGET_PRICE', 'PERCENT_DROP', 'NEW_LOW');
CREATE TYPE "SnapshotSource" AS ENUM ('MANUAL', 'ADMIN', 'AMAZON_CREATORS', 'WORKER');

-- AlterTable products
ALTER TABLE "products" ADD COLUMN "model_number" TEXT;
ALTER TABLE "products" ADD COLUMN "who_should_avoid" TEXT;
ALTER TABLE "products" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "products" ADD COLUMN "published_at" TIMESTAMP(3);

UPDATE "products" SET "published_at" = "created_at" WHERE "is_active" = true AND "published_at" IS NULL;

CREATE INDEX "products_status_is_active_idx" ON "products"("status", "is_active");
CREATE INDEX "products_brand_idx" ON "products"("brand");
CREATE INDEX "products_updated_at_idx" ON "products"("updated_at");

-- AlterTable merchants
ALTER TABLE "merchants" ADD COLUMN "integration_key" TEXT;
ALTER TABLE "merchants" ADD COLUMN "rate_limit_per_second" DECIMAL(8,3);
ALTER TABLE "merchants" ADD COLUMN "host_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "merchants" ADD COLUMN "fetch_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "merchants_integration_key_key" ON "merchants"("integration_key");
CREATE INDEX "merchants_is_active_idx" ON "merchants"("is_active");

UPDATE "merchants"
SET
  "integration_key" = 'AMAZON_IN',
  "host_allowlist" = ARRAY['www.amazon.in', 'amazon.in', 'www.amazon.com', 'amzn.in', 'amzn.to']::TEXT[],
  "rate_limit_per_second" = 1
WHERE "slug" = 'amazon';

-- AlterTable offers
ALTER TABLE "offers" ADD COLUMN "product_url" TEXT;
ALTER TABLE "offers" ADD COLUMN "availability" "AvailabilityStatus" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "offers" ADD COLUMN "last_successful_fetch_at" TIMESTAMP(3);
ALTER TABLE "offers" ADD COLUMN "next_fetch_at" TIMESTAMP(3);
ALTER TABLE "offers" ADD COLUMN "fetch_status" "OfferFetchStatus" NOT NULL DEFAULT 'NEVER';
ALTER TABLE "offers" ADD COLUMN "fetch_error" TEXT;
ALTER TABLE "offers" ADD COLUMN "consecutive_failures" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "offers" ADD COLUMN "metadata" JSONB;

UPDATE "offers" SET "availability" = CASE WHEN "in_stock" THEN 'IN_STOCK'::"AvailabilityStatus" ELSE 'OUT_OF_STOCK'::"AvailabilityStatus" END;
UPDATE "offers" SET "next_fetch_at" = NOW() WHERE "external_id" <> '';

CREATE INDEX "offers_next_fetch_at_fetch_status_idx" ON "offers"("next_fetch_at", "fetch_status");
CREATE INDEX "offers_product_id_in_stock_idx" ON "offers"("product_id", "in_stock");
CREATE UNIQUE INDEX "offers_merchant_id_external_id_uidx" ON "offers"("merchant_id", "external_id") WHERE "external_id" <> '';

-- AlterTable price_snapshots
ALTER TABLE "price_snapshots" ADD COLUMN "original_price" DECIMAL(12,2);
ALTER TABLE "price_snapshots" ADD COLUMN "availability" "AvailabilityStatus";
ALTER TABLE "price_snapshots" ADD COLUMN "in_stock" BOOLEAN;
ALTER TABLE "price_snapshots" ADD COLUMN "source" "SnapshotSource" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "price_snapshots" ADD COLUMN "fetch_status" "OfferFetchStatus";

CREATE INDEX "price_snapshots_recorded_at_idx" ON "price_snapshots"("recorded_at");

-- CreateTable product_identifiers
CREATE TABLE "product_identifiers" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,
    "merchant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_identifiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_identifiers_type_value_key" ON "product_identifiers"("type", "value");
CREATE INDEX "product_identifiers_product_id_idx" ON "product_identifiers"("product_id");

ALTER TABLE "product_identifiers" ADD CONSTRAINT "product_identifiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_identifiers" ADD CONSTRAINT "product_identifiers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "product_identifiers" ("id", "product_id", "type", "value", "created_at")
SELECT gen_random_uuid()::text, p."id", 'ASIN', p."source_id", NOW()
FROM "products" p
WHERE p."source_id" IS NOT NULL AND p."source_id" <> ''
ON CONFLICT ("type", "value") DO NOTHING;

INSERT INTO "product_identifiers" ("id", "product_id", "type", "value", "merchant_id", "created_at")
SELECT gen_random_uuid()::text, o."product_id", 'ASIN', o."external_id", o."merchant_id", NOW()
FROM "offers" o
WHERE o."external_id" <> ''
ON CONFLICT ("type", "value") DO NOTHING;

-- CreateTable jobs
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "run_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "jobs_status_run_after_priority_idx" ON "jobs"("status", "run_after", "priority");
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");

-- CreateTable worker_heartbeats
CREATE TABLE "worker_heartbeats" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "stats" JSONB,

    CONSTRAINT "worker_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable price_events
CREATE TABLE "price_events" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "type" "PriceEventType" NOT NULL,
    "previous_price" DECIMAL(12,2),
    "current_price" DECIMAL(12,2),
    "percent" DECIMAL(8,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_events_product_id_created_at_idx" ON "price_events"("product_id", "created_at");
CREATE INDEX "price_events_type_created_at_idx" ON "price_events"("type", "created_at");

ALTER TABLE "price_events" ADD CONSTRAINT "price_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_events" ADD CONSTRAINT "price_events_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable price_alerts
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "email" TEXT NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "verify_token_hash" TEXT,
    "type" "AlertType" NOT NULL,
    "target_price" DECIMAL(12,2),
    "percent_threshold" DECIMAL(8,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "unsub_token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_alerts_product_id_is_active_idx" ON "price_alerts"("product_id", "is_active");
CREATE INDEX "price_alerts_email_normalized_idx" ON "price_alerts"("email_normalized");
CREATE INDEX "price_alerts_verify_token_hash_idx" ON "price_alerts"("verify_token_hash");
CREATE INDEX "price_alerts_unsub_token_hash_idx" ON "price_alerts"("unsub_token_hash");

ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
