export type AffiliateMerchant = {
  defaultTag?: string | null;
  network?: string | null;
  integrationKey?: string | null;
  slug?: string | null;
  hostAllowlist?: string[];
};

export interface AffiliateResolver {
  key: string;
  resolve(input: { url: string; merchant: AffiliateMerchant }): string;
}
