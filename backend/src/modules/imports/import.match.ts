import type { IdentifierType } from "../../generated/prisma/client.js";
import { isSafeHttpUrl } from "../../lib/url.js";
import type { CatalogIdentifier, NormalizedOffer } from "../integrations/types.js";

export type ImportAction = "create" | "attach-offer" | "refresh-offer" | "review";

export const GLOBAL_CATALOG_TYPES: IdentifierType[] = ["GTIN", "EAN", "UPC"];
export const GLOBAL_UNIQUE_TYPES: IdentifierType[] = ["ASIN", "GTIN", "EAN", "UPC"];
export const MERCHANT_SCOPED_TYPES: IdentifierType[] = ["SKU", "MERCHANT_ID", "MPN"];

export function isGlobalUniqueType(type: IdentifierType): boolean {
  return (GLOBAL_UNIQUE_TYPES as string[]).includes(type);
}

export function isMerchantScopedType(type: IdentifierType): boolean {
  return (MERCHANT_SCOPED_TYPES as string[]).includes(type);
}

export function isGlobalCatalogType(type: IdentifierType): boolean {
  return (GLOBAL_CATALOG_TYPES as string[]).includes(type);
}

export function normalizeIdentifierValue(type: IdentifierType, value: string): string {
  const trimmed = value.trim();
  if (type === "GTIN" || type === "EAN" || type === "UPC") {
    return trimmed.replace(/\D/g, "");
  }
  if (type === "ASIN") {
    return trimmed.toUpperCase();
  }
  return trimmed;
}

export function uniqueIdentifierRefs(refs: CatalogIdentifier[]): CatalogIdentifier[] {
  const seen = new Set<string>();
  const result: CatalogIdentifier[] = [];
  for (const ref of refs) {
    const value = normalizeIdentifierValue(ref.type, ref.value);
    if (!value) {
      continue;
    }
    const key = `${ref.type}:${value}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({ type: ref.type, value });
  }
  return result;
}

export function catalogIdentifiersFromItem(
  item: NormalizedOffer | null | undefined,
  listingType: IdentifierType,
  externalId: string,
): CatalogIdentifier[] {
  return uniqueIdentifierRefs([
    ...(item?.identifiers ?? []),
    { type: listingType, value: externalId },
  ]);
}

export function globalCatalogIdentifiers(refs: CatalogIdentifier[]): CatalogIdentifier[] {
  return refs.filter((ref) => isGlobalCatalogType(ref.type));
}

export function chunkIds(ids: string[], size = 10): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

export function decideImportAction(input: {
  globalProductId?: string | null;
  identifierProductId: string | null;
  offerId: string | null;
  offerProductId?: string | null;
}): ImportAction {
  const matchedIds = uniqueIds([input.globalProductId, input.identifierProductId, input.offerProductId]);
  if (matchedIds.length > 1) {
    return "review";
  }

  const productId = matchedIds[0] ?? null;
  if (productId) {
    if (input.offerId && (input.offerProductId == null || input.offerProductId === productId)) {
      return "refresh-offer";
    }
    if (input.offerId && input.offerProductId && input.offerProductId !== productId) {
      return "review";
    }
    return "attach-offer";
  }

  if (input.offerId) {
    return "refresh-offer";
  }
  return "create";
}

export function matchedProductId(input: {
  globalProductId?: string | null;
  identifierProductId: string | null;
  offerProductId?: string | null;
}): string | null {
  return uniqueIds([input.globalProductId, input.identifierProductId, input.offerProductId])[0] ?? null;
}

export function publishBlockReason(offers: { affiliateUrl: string }[]): string | null {
  if (offers.length === 0) {
    return "Publish requires at least one offer";
  }
  if (!offers.some((offer) => isSafeHttpUrl(offer.affiliateUrl))) {
    return "Publish requires a valid merchant URL";
  }
  return null;
}
