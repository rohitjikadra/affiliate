import type { MerchantAdapter, NormalizedOffer } from "./types.js";

export const FAKE_ADAPTER_KEY = "FAKE_TEST";

export function createFakeAdapter(options: {
  enabled?: boolean;
  lookup?: MerchantAdapter["lookup"];
  items?: NormalizedOffer[];
} = {}): MerchantAdapter {
  return {
    key: FAKE_ADAPTER_KEY,
    enabled: options.enabled ?? true,
    listingIdentifierType: "MERCHANT_ID",
    productSource: "MANUAL",
    emptyIdsMessage: "Provide at least one product id",
    async lookup(ids) {
      if (options.lookup) {
        return options.lookup(ids);
      }
      const wanted = new Set(ids);
      return (options.items ?? []).filter((item) => wanted.has(item.externalId));
    },
    validate(item) {
      if (!item.externalId.trim()) {
        return "Missing external id";
      }
      if (item.price == null || item.price <= 0) {
        return "Price must be greater than 0";
      }
      return null;
    },
    parseExternalIds(raw) {
      return [...new Set(raw.map((value) => value.trim()).filter(Boolean))];
    },
    fallbackUrls(externalId) {
      const productUrl = `https://example.com/p/${externalId}`;
      return { productUrl, affiliateUrl: productUrl };
    },
  };
}
