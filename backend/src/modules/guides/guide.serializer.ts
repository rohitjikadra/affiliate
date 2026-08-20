import type { Category, Guide, GuideKind, GuideProductBadge } from "../../generated/prisma/client.js";
import { serializeProduct, type SerializedProduct } from "../products/product.serializer.js";

type GuideProductRow = {
  id: string;
  rank: number | null;
  badge: GuideProductBadge;
  notes: string | null;
  product: Parameters<typeof serializeProduct>[0];
};

type GuideWithRelations = Guide & {
  category: Pick<Category, "id" | "slug" | "name"> | null;
  products?: GuideProductRow[];
};

type SerializeOptions = {
  includeBody?: boolean;
};

export function serializeGuide(guide: GuideWithRelations, options: SerializeOptions = {}) {
  const includeBody = options.includeBody ?? true;
  const ranked = [...(guide.products ?? [])].sort((left, right) => (left.rank ?? 999) - (right.rank ?? 999));

  return {
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    excerpt: guide.excerpt,
    body: includeBody ? guide.body : "",
    kind: guide.kind as GuideKind,
    published: guide.published,
    methodology: includeBody ? guide.methodology : null,
    seoTitle: guide.seoTitle,
    seoDescription: guide.seoDescription,
    categoryId: guide.categoryId,
    category: guide.category,
    products: ranked.map((item) => ({
      id: item.id,
      rank: item.rank,
      badge: item.badge,
      notes: item.notes,
      product: serializeProduct(item.product, { includeAffiliateUrl: false }) as SerializedProduct,
    })),
    createdAt: guide.createdAt.toISOString(),
    updatedAt: guide.updatedAt.toISOString(),
  };
}

export type SerializedGuide = ReturnType<typeof serializeGuide>;
