export type CatalogIdentifier = {
  type: "ASIN" | "GTIN" | "EAN" | "UPC" | "MPN" | "SKU" | "MERCHANT_ID";
  value: string;
};

export type NormalizedOffer = {
  externalId: string;
  title: string | null;
  brand?: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
  productUrl: string | null;
  affiliateUrl: string | null;
  imageUrls: string[];
  fetchedAt: Date;
  metadata?: Record<string, unknown>;
  identifiers?: CatalogIdentifier[];
};

export type DiscoveryCandidate = {
  externalId: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string;
};

export interface MerchantAdapter {
  key: string;
  enabled: boolean;
  listingIdentifierType?: CatalogIdentifier["type"];
  productSource?: "MANUAL" | "AMAZON" | "FLIPKART";
  emptyIdsMessage?: string;
  lookup(ids: string[]): Promise<NormalizedOffer[]>;
  search?(query: string): Promise<DiscoveryCandidate[]>;
  validate(item: NormalizedOffer): string | null;
  parseExternalIds?(raw: string[]): string[];
  fallbackUrls?(
    externalId: string,
    tag?: string | null,
  ): { productUrl: string | null; affiliateUrl: string | null };
}

export class AdapterDisabledError extends Error {
  constructor(key: string) {
    super(`${key} adapter is disabled`);
    this.name = "AdapterDisabledError";
  }
}
