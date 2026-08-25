import { isSafeHttpUrl } from "../../lib/url.js";

export function parseImportAsins(raw: string[]): string[] {
  return [...new Set(raw.map((value) => value.trim().toUpperCase()).filter((value) => /^[A-Z0-9]{10}$/.test(value)))];
}

export function chunkAsins(ids: string[], size = 10): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

export function taggedAmazonUrl(asin: string, partnerTag: string | null | undefined): string {
  const base = `https://www.amazon.in/dp/${asin}`;
  return partnerTag ? `${base}?tag=${partnerTag}` : base;
}

export function decideImportAction(input: {
  identifierProductId: string | null;
  offerId: string | null;
  offerProductId?: string | null;
}): "create" | "attach-offer" | "refresh-offer" {
  if (input.identifierProductId) {
    if (input.offerId && (input.offerProductId == null || input.offerProductId === input.identifierProductId)) {
      return "refresh-offer";
    }
    return "attach-offer";
  }
  if (input.offerId) {
    return "refresh-offer";
  }
  return "create";
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
