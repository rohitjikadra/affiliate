import type { Merchant, Offer } from "../../generated/prisma/client.js";
import { isSafeHttpUrl } from "../../lib/url.js";
import { freshnessLabel, freshnessLevel } from "../../lib/freshness.js";

type OfferWithMerchant = Offer & {
  merchant: Pick<Merchant, "id" | "slug" | "name" | "kind" | "network" | "isActive">;
};

type SerializeOfferOptions = {
  includeAffiliateUrl?: boolean;
};

export function serializeOffer(offer: OfferWithMerchant, options: SerializeOfferOptions = {}) {
  const includeAffiliateUrl = options.includeAffiliateUrl ?? false;
  const checkedAt = offer.lastSuccessfulFetchAt ?? offer.lastCheckedAt ?? null;

  return {
    id: offer.id,
    productId: offer.productId,
    merchantId: offer.merchantId,
    merchant: {
      id: offer.merchant.id,
      slug: offer.merchant.slug,
      name: offer.merchant.name,
      kind: offer.merchant.kind,
      network: offer.merchant.network,
    },
    title: offer.title,
    price: offer.price?.toString() ?? null,
    originalPrice: offer.originalPrice?.toString() ?? null,
    currency: offer.currency,
    affiliateUrl: includeAffiliateUrl ? offer.affiliateUrl : null,
    productUrl: includeAffiliateUrl ? (offer.productUrl ?? null) : null,
    externalId: offer.externalId || null,
    inStock: offer.inStock,
    isPrimary: offer.isPrimary,
    available: offer.inStock && offer.merchant.isActive && isSafeHttpUrl(offer.affiliateUrl),
    lastCheckedAt: offer.lastCheckedAt?.toISOString() ?? null,
    lastSuccessfulFetchAt: offer.lastSuccessfulFetchAt?.toISOString() ?? null,
    fetchStatus: offer.fetchStatus ?? "NEVER",
    availability: offer.availability ?? "UNKNOWN",
    freshness: freshnessLevel(checkedAt),
    freshnessLabel: freshnessLabel(checkedAt),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

export type SerializedOffer = ReturnType<typeof serializeOffer>;
