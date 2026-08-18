export type ProductSource = "MANUAL" | "AMAZON" | "FLIPKART";

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount?: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  originalPrice: string | null;
  rating: string | null;
  currency: string;
  affiliateUrl: string | null;
  source: ProductSource;
  store: string;
  sourceId: string | null;
  featured: boolean;
  isActive: boolean;
  available: boolean;
  categoryId: string | null;
  category: Pick<ProductCategory, "id" | "slug" | "name"> | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductPayload = {
  title: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  originalPrice?: number | null;
  rating?: number | null;
  currency: string;
  affiliateUrl?: string | null;
  source: ProductSource;
  sourceId?: string | null;
  featured: boolean;
  isActive: boolean;
  categoryId?: string | null;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
