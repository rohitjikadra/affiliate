-- AlterTable
ALTER TABLE "products" ADD COLUMN "brand" TEXT;
ALTER TABLE "products" ADD COLUMN "warranty" TEXT;
ALTER TABLE "products" ADD COLUMN "specs" JSONB;
ALTER TABLE "products" ADD COLUMN "score_breakdown" JSONB;
ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;
