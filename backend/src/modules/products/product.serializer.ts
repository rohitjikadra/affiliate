import type { Category, Product, ProductSource } from "../../generated/prisma/client.js";
import { isSafeHttpUrl } from "../../lib/url.js";

type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "slug" | "name"> | null;
  _count?: { clicks: number };
};

const storeLabels: Record<ProductSource, string> = {
  MANUAL: "AffiliateHub",
  AMAZON: "Amazon",
  FLIPKART: "Flipkart",
};

type SerializeOptions = {
  includeAffiliateUrl?: boolean;
  includeClickCount?: boolean;
};

export function serializeProduct(product: ProductWithCategory, options: SerializeOptions = {}) {
  const includeAffiliateUrl = options.includeAffiliateUrl ?? true;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.price.toString(),
    originalPrice: product.originalPrice?.toString() ?? null,
    rating: product.rating?.toString() ?? null,
    currency: product.currency,
    affiliateUrl: includeAffiliateUrl ? product.affiliateUrl : null,
    source: product.source,
    store: storeLabels[product.source],
    sourceId: product.sourceId,
    featured: product.featured,
    isActive: product.isActive,
    available: product.isActive && isSafeHttpUrl(product.affiliateUrl),
    clickCount: options.includeClickCount ? (product._count?.clicks ?? 0) : undefined,
    categoryId: product.categoryId,
    category: product.category,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type SerializedProduct = ReturnType<typeof serializeProduct>;
