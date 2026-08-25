import { formatOptionalMoney } from "@/lib/money";
import type { Offer, Product } from "@/types/product";

export function numericOfferPrice(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined || price === "") {
    return null;
  }
  const value = typeof price === "number" ? price : Number(price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function formatOfferPrice(
  price: string | number | null | undefined,
  currency = "INR",
  maximumFractionDigits = 0,
): string | null {
  const value = numericOfferPrice(price);
  if (value == null) {
    return null;
  }
  return formatOptionalMoney(value, currency, maximumFractionDigits);
}

export function findApiBestOffer(product: Product): Offer | undefined {
  if (!product.bestOfferId) {
    return undefined;
  }
  return product.offers.find((offer) => offer.id === product.bestOfferId);
}

export function currentBestOffer(product: Product): Offer | undefined {
  const offer = findApiBestOffer(product);
  if (!offer || !offer.available || offer.freshness === "stale") {
    return undefined;
  }
  if (numericOfferPrice(offer.price) == null) {
    return undefined;
  }
  return offer;
}

export function checkoutOffer(product: Product): Offer | undefined {
  const best = currentBestOffer(product);
  if (best) {
    return best;
  }
  const buyable = product.offers.filter((offer) => offer.available);
  return buyable.find((offer) => offer.isPrimary) ?? buyable[0];
}

export function availabilityLabel(offer: Offer): string {
  if (offer.availability === "OUT_OF_STOCK" || !offer.inStock) {
    return "Out of stock";
  }
  if (offer.availability === "IN_STOCK") {
    return "In stock";
  }
  return "Availability unknown";
}

export function sortOffersForDisplay(offers: Offer[], bestOfferId?: string | null): Offer[] {
  return [...offers].sort((left, right) => {
    if (left.id === bestOfferId) {
      return -1;
    }
    if (right.id === bestOfferId) {
      return 1;
    }
    const leftPrice = numericOfferPrice(left.price);
    const rightPrice = numericOfferPrice(right.price);
    if (leftPrice == null && rightPrice == null) {
      return 0;
    }
    if (leftPrice == null) {
      return 1;
    }
    if (rightPrice == null) {
      return -1;
    }
    return leftPrice - rightPrice;
  });
}
