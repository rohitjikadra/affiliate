-- Additive identifier uniqueness: keep ASIN/GTIN/EAN/UPC globally unique,
-- and scope SKU/MERCHANT_ID/MPN to a merchant so listings cannot collide.
-- Existing ASIN rows remain unique. Empty-string offer IDs are unchanged.

DROP INDEX IF EXISTS "product_identifiers_type_value_key";

CREATE UNIQUE INDEX "product_identifiers_global_type_value_key"
  ON "product_identifiers" ("type", "value")
  WHERE "type" IN ('ASIN', 'GTIN', 'EAN', 'UPC');

CREATE UNIQUE INDEX "product_identifiers_merchant_type_value_key"
  ON "product_identifiers" ("merchant_id", "type", "value")
  WHERE "merchant_id" IS NOT NULL AND "type" IN ('SKU', 'MERCHANT_ID', 'MPN');

CREATE INDEX "product_identifiers_type_value_idx"
  ON "product_identifiers" ("type", "value");

CREATE INDEX "product_identifiers_merchant_id_type_value_idx"
  ON "product_identifiers" ("merchant_id", "type", "value");
