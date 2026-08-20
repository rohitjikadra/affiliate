import type { Product } from "./product";

export type ComparisonItem = {
  id: string;
  sortOrder: number;
  notes: string | null;
  product: Product;
};

export type Comparison = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  published: boolean;
  winnerProductId: string | null;
  winner: { id: string; slug: string; title: string } | null;
  methodology: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  items: ComparisonItem[];
  createdAt: string;
  updatedAt: string;
};

export type ComparisonPayload = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  body: string;
  published: boolean;
  winnerProductId?: string | null;
  methodology?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  items: { productId: string; sortOrder?: number; notes?: string | null }[];
};
