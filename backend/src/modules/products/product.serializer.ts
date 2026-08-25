import type { Product, ProductSource } from "../../generated/prisma/client.js";
import { freshnessLabel } from "../../lib/freshness.js";
import { serializeOffer } from "../offers/offer.serializer.js";
import { summarizeBestPrice } from "../pricing/best-price.js";

const storeLabels: Record<ProductSource, string> = {
  MANUAL: "My Pasand Shop",
  AMAZON: "Amazon",
  FLIPKART: "Flipkart",
};

type SerializeOptions = {
  includeAffiliateUrl?: boolean;
  includeClickCount?: boolean;
};

type LooseProduct = Product & {
  modelNumber?: string | null;
  whoShouldAvoid?: string | null;
  status?: string;
  publishedAt?: Date | null;
  features?: string | null;
  category?: { id: string; slug: string; name: string } | null;
  _count?: { clicks: number };
  offers?: Parameters<typeof serializeOffer>[0][];
};

export type SpecItem = { label: string; value: string };
export type ScoreBreakdownItem = { label: string; score: number };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseSpecs(value: unknown): SpecItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: SpecItem[] = [];
  for (const raw of value) {
    const row = asRecord(raw);
    if (!row) {
      continue;
    }
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const specValue = typeof row.value === "string" ? row.value.trim() : "";
    if (label && specValue) {
      items.push({ label, value: specValue });
    }
  }
  return items;
}

export function parseImageUrls(value: unknown, fallback?: string | null): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (raw: unknown) => {
    if (typeof raw !== "string" || urls.length >= 12) {
      return;
    }
    const url = raw.trim();
    if (!url || seen.has(url)) {
      return;
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return;
      }
    } catch {
      return;
    }
    seen.add(url);
    urls.push(url);
  };

  if (Array.isArray(value)) {
    for (const item of value) {
      add(item);
    }
  }

  if (urls.length === 0 && fallback) {
    add(fallback);
  }

  return urls;
}

export function parseScoreBreakdown(value: unknown): ScoreBreakdownItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: ScoreBreakdownItem[] = [];
  for (const raw of value) {
    const row = asRecord(raw);
    if (!row) {
      continue;
    }
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const score = typeof row.score === "number" ? row.score : Number(row.score);
    if (label && Number.isFinite(score) && score >= 0 && score <= 10) {
      items.push({ label, score });
    }
  }
  return items;
}

function editorialScore(product: Product): string | null {
  return product.ourScore != null ? product.ourScore.toString() : null;
}

export function serializeProduct(product: LooseProduct, options: SerializeOptions = {}) {
  const includeAffiliateUrl = options.includeAffiliateUrl ?? false;
  const offers = (product.offers ?? []).map((offer) => serializeOffer(offer, { includeAffiliateUrl }));
  const best = summarizeBestPrice(product.offers ?? []);
  const primaryOffer = offers.find((offer) => offer.isPrimary) ?? offers[0] ?? null;
  const bestOffer = offers.find((offer) => offer.id === best.offerId) ?? primaryOffer;
  const hasLiveOffer = offers.some((offer) => offer.available);
  const productPrice = product.price != null ? product.price.toString() : null;
  const images = parseImageUrls(product.images, product.imageUrl);
  const checkedAt = best.checkedAt;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    features: product.features ?? null,
    pros: product.pros,
    cons: product.cons,
    bestFor: product.bestFor,
    faq: product.faq,
    brand: product.brand,
    modelNumber: product.modelNumber ?? null,
    whoShouldAvoid: product.whoShouldAvoid ?? null,
    status: product.status ?? "PUBLISHED",
    publishedAt: product.publishedAt?.toISOString() ?? null,
    warranty: product.warranty,
    specs: parseSpecs(product.specs),
    scoreBreakdown: parseScoreBreakdown(product.scoreBreakdown),
    images,
    imageUrl: images[0] ?? null,
    price: best.price ?? bestOffer?.price ?? productPrice,
    originalPrice: best.originalPrice ?? bestOffer?.originalPrice ?? product.originalPrice?.toString() ?? null,
    ourScore: editorialScore(product),
    currency: best.currency ?? bestOffer?.currency ?? product.currency,
    lastCheckedAt: checkedAt ?? bestOffer?.lastCheckedAt ?? null,
    freshness: best.freshness,
    freshnessLabel: freshnessLabel(checkedAt),
    bestOfferId: best.offerId,
    offerCount: best.offerCount,
    affiliateUrl: includeAffiliateUrl && !primaryOffer ? product.affiliateUrl : null,
    source: product.source,
    store: best.merchantName ?? bestOffer?.merchant.name ?? storeLabels[product.source],
    sourceId: includeAffiliateUrl ? product.sourceId : null,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    featured: product.featured,
    isActive: product.isActive,
    available: product.isActive && (product.status ?? "PUBLISHED") === "PUBLISHED" && hasLiveOffer,
    clickCount: options.includeClickCount ? (product._count?.clicks ?? 0) : undefined,
    categoryId: product.categoryId,
    category: product.category ?? null,
    offers,
    primaryOfferId: primaryOffer?.id ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type SerializedProduct = ReturnType<typeof serializeProduct>;
