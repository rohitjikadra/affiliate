import type { GuideKind, GuideProductBadge, Product } from "./product";

export type GuideProduct = {
  id: string;
  rank: number | null;
  badge: GuideProductBadge;
  notes: string | null;
  product: Product;
};

export type Guide = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  kind: GuideKind;
  published: boolean;
  methodology: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string | null;
  category: { id: string; slug: string; name: string } | null;
  products: GuideProduct[];
  createdAt: string;
  updatedAt: string;
};

export type GuidePayload = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  body: string;
  kind: GuideKind;
  published: boolean;
  methodology?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryId?: string | null;
  products?: {
    productId: string;
    rank?: number | null;
    badge?: GuideProductBadge;
    notes?: string | null;
  }[];
};
