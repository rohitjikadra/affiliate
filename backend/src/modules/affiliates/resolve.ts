import { amazonAffiliateResolver } from "./amazon.js";
import type { AffiliateMerchant, AffiliateResolver } from "./types.js";

export type { AffiliateMerchant, AffiliateResolver } from "./types.js";

export const passthroughAffiliateResolver: AffiliateResolver = {
  key: "PASSTHROUGH",
  resolve({ url }) {
    return url;
  },
};

const resolvers = new Map<string, AffiliateResolver>([
  ["AMAZON_IN", amazonAffiliateResolver],
  ["AMAZON", amazonAffiliateResolver],
  ["amazon", amazonAffiliateResolver],
]);

function lookupResolver(key: string): AffiliateResolver | undefined {
  return resolvers.get(key) ?? resolvers.get(key.toUpperCase()) ?? resolvers.get(key.toLowerCase());
}

export function getAffiliateResolver(merchant: AffiliateMerchant): AffiliateResolver {
  for (const key of [merchant.integrationKey, merchant.network, merchant.slug]) {
    if (!key) {
      continue;
    }
    const found = lookupResolver(key);
    if (found) {
      return found;
    }
  }
  return passthroughAffiliateResolver;
}

export function resolveAffiliateUrl(url: string, merchant: AffiliateMerchant): string {
  return getAffiliateResolver(merchant).resolve({ url, merchant });
}
