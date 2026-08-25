import { createAmazonAdapter } from "./amazon.js";
import type { MerchantAdapter } from "./types.js";

export type AdapterFactory = (partnerTag?: string | null) => MerchantAdapter;

const factories = new Map<string, AdapterFactory>();
const cache = new Map<string, MerchantAdapter>();

function dropCached(key: string): void {
  for (const cacheKey of [...cache.keys()]) {
    if (cacheKey === key || cacheKey.startsWith(`${key}:`)) {
      cache.delete(cacheKey);
    }
  }
}

export function registerAdapter(key: string, factory: AdapterFactory): () => void {
  factories.set(key, factory);
  dropCached(key);
  return () => {
    factories.delete(key);
    dropCached(key);
  };
}

registerAdapter("AMAZON_IN", (partnerTag) => createAmazonAdapter(partnerTag));

export function getAdapter(key: string, partnerTag?: string | null): MerchantAdapter | null {
  const factory = factories.get(key);
  if (!factory) {
    return null;
  }
  const cacheKey = `${key}:${partnerTag ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const created = factory(partnerTag);
  cache.set(cacheKey, created);
  return created;
}
