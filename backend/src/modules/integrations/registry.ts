import { createAmazonAdapter } from "./amazon.js";
import type { MerchantAdapter } from "./types.js";

const cache = new Map<string, MerchantAdapter>();

export function getAdapter(key: string, partnerTag?: string | null): MerchantAdapter | null {
  if (key !== "AMAZON_IN") {
    return null;
  }
  const cacheKey = `${key}:${partnerTag ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const created = createAmazonAdapter(partnerTag);
  cache.set(cacheKey, created);
  return created;
}
