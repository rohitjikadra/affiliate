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
  lookup(ids: string[]): Promise<NormalizedOffer[]>;
  search?(query: string): Promise<DiscoveryCandidate[]>;
}

export class AdapterDisabledError extends Error {
  constructor(key: string) {
    super(`${key} adapter is disabled`);
    this.name = "AdapterDisabledError";
  }
}
