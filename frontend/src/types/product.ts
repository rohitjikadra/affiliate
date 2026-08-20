export type ProductSource = "MANUAL" | "AMAZON" | "FLIPKART";
export type MerchantKind = "MARKETPLACE" | "DIRECT" | "NETWORK";
export type GuideKind = "ARTICLE" | "BEST_OF";
export type GuideProductBadge =
  | "BEST_OVERALL"
  | "BEST_BUDGET"
  | "BEST_PREMIUM"
  | "BEST_FOR_BEGINNERS"
  | "RELATED";

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
  nextPage: number | null;
  previousPage: number | null;
};

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount?: number;
  guideCount?: number;
};

export type Merchant = {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string | null;
  kind: MerchantKind;
  logoUrl: string | null;
  isActive: boolean;
  network: string | null;
  defaultTag: string | null;
  disclosure: string | null;
  offerCount?: number;
};

export type Offer = {
  id: string;
  productId: string;
  merchantId: string;
  merchant: {
    id: string;
    slug: string;
    name: string;
    kind: MerchantKind;
    network: string | null;
  };
  title: string | null;
  price: string | null;
  originalPrice: string | null;
  currency: string;
  affiliateUrl: string | null;
  externalId: string | null;
  inStock: boolean;
  isPrimary: boolean;
  available: boolean;
  lastCheckedAt: string | null;
  updatedAt: string;
};

export type SpecItem = {
  label: string;
  value: string;
};

export type ScoreBreakdownItem = {
  label: string;
  score: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pros: string | null;
  cons: string | null;
  bestFor: string | null;
  faq: string | null;
  brand: string | null;
  warranty: string | null;
  specs: SpecItem[];
  scoreBreakdown: ScoreBreakdownItem[];
  images: string[];
  imageUrl: string | null;
  price: string | null;
  originalPrice: string | null;
  ourScore: string | null;
  currency: string;
  lastCheckedAt: string | null;
  affiliateUrl: string | null;
  source: ProductSource;
  store: string;
  sourceId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featured: boolean;
  isActive: boolean;
  available: boolean;
  categoryId: string | null;
  category: Pick<ProductCategory, "id" | "slug" | "name"> | null;
  offers: Offer[];
  primaryOfferId: string | null;
  clickCount?: number;
  relatedProducts?: Product[];
  relatedGuides?: import("./guide").Guide[];
  relatedComparisons?: import("./comparison").Comparison[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryPayload = {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type ProductPayload = {
  title: string;
  slug?: string;
  description?: string | null;
  pros?: string | null;
  cons?: string | null;
  bestFor?: string | null;
  faq?: string | null;
  brand?: string | null;
  warranty?: string | null;
  specs?: SpecItem[] | null;
  scoreBreakdown?: ScoreBreakdownItem[] | null;
  images?: string[] | null;
  imageUrl?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  ourScore?: number | null;
  currency: string;
  affiliateUrl?: string | null;
  source: ProductSource;
  sourceId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featured: boolean;
  isActive: boolean;
  categoryId?: string | null;
};

export type MerchantPayload = {
  name: string;
  slug?: string;
  websiteUrl?: string | null;
  kind: MerchantKind;
  logoUrl?: string | null;
  isActive: boolean;
  network?: string | null;
  defaultTag?: string | null;
  disclosure?: string | null;
};

export type OfferPayload = {
  merchantId: string;
  title?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  currency: string;
  affiliateUrl: string;
  externalId?: string | null;
  inStock: boolean;
  isPrimary: boolean;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { path: string; message: string }[],
    public redirectSlug?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
