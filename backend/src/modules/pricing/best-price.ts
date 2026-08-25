import { freshnessLevel, isFreshEnough } from "../../lib/freshness.js";

export type PricedOffer = {
  id: string;
  price: { toString(): string } | number | string | null;
  originalPrice?: { toString(): string } | number | string | null;
  currency?: string | null;
  inStock: boolean;
  lastCheckedAt?: Date | string | null;
  lastSuccessfulFetchAt?: Date | string | null;
  fetchStatus?: string | null;
  merchant?: { isActive?: boolean; name?: string | null } | null;
};

export type BestPriceSummary = {
  offerId: string | null;
  price: string | null;
  originalPrice: string | null;
  currency: string;
  merchantName: string | null;
  freshness: ReturnType<typeof freshnessLevel>;
  offerCount: number;
  checkedAt: string | null;
};

function toNumber(value: PricedOffer["price"]): number | null {
  if (value == null) {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toStringPrice(value: PricedOffer["price"]): string | null {
  const parsed = toNumber(value);
  return parsed == null ? null : parsed.toFixed(2);
}

export function selectBestOffer<T extends PricedOffer>(offers: T[], now = Date.now()): T | null {
  const eligible = offers.filter((offer) => {
    if (!offer.inStock || toNumber(offer.price) == null) {
      return false;
    }
    if (offer.merchant && offer.merchant.isActive === false) {
      return false;
    }
    const checkedAt = offer.lastSuccessfulFetchAt ?? offer.lastCheckedAt ?? null;
    if (!checkedAt && (offer.fetchStatus === "NEVER" || offer.fetchStatus == null)) {
      return true;
    }
    return isFreshEnough(checkedAt, 24 * 60 * 60 * 1000, now);
  });

  eligible.sort(
    (a, b) => (toNumber(a.price) ?? Number.POSITIVE_INFINITY) - (toNumber(b.price) ?? Number.POSITIVE_INFINITY),
  );
  return eligible[0] ?? null;
}

export function summarizeBestPrice<T extends PricedOffer>(
  offers: T[],
  fallbackCurrency = "INR",
  now = Date.now(),
): BestPriceSummary {
  const live = offers.filter((offer) => offer.merchant?.isActive !== false);
  const best = selectBestOffer(live, now);
  const checkedAt = best?.lastSuccessfulFetchAt ?? best?.lastCheckedAt ?? null;

  return {
    offerId: best?.id ?? null,
    price: toStringPrice(best?.price ?? null),
    originalPrice: toStringPrice(best?.originalPrice ?? null),
    currency: best?.currency ?? fallbackCurrency,
    merchantName: best?.merchant?.name ?? null,
    freshness: freshnessLevel(checkedAt, now),
    offerCount: live.length,
    checkedAt: checkedAt ? new Date(checkedAt).toISOString() : null,
  };
}
