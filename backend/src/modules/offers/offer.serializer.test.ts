import { describe, expect, it } from "vitest";
import { serializeOffer } from "./offer.serializer.js";

const offer = {
  id: "o1",
  productId: "p1",
  merchantId: "m1",
  title: "Cloud VPS",
  price: { toString: () => "9.99" } as never,
  originalPrice: null,
  currency: "USD",
  affiliateUrl: "https://www.hostinger.com/vps?ref=secret",
  externalId: "vps-kvm-1",
  inStock: true,
  isPrimary: true,
  lastCheckedAt: null,
  lastSuccessfulFetchAt: null,
  fetchStatus: "NEVER",
  availability: "UNKNOWN",
  productUrl: "https://www.hostinger.com/vps",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  merchant: {
    id: "m1",
    slug: "hostinger",
    name: "Hostinger",
    kind: "DIRECT" as const,
    network: "DIRECT",
    isActive: true,
    disclosure: null,
  },
};

describe("serializeOffer", () => {
  it("hides affiliate URLs by default", () => {
    const data = serializeOffer(offer);
    expect(data.affiliateUrl).toBeNull();
    expect(data.available).toBe(true);
    expect(data.merchant.disclosure).toBeNull();
  });

  it("includes affiliate URLs only when asked", () => {
    const data = serializeOffer(offer, { includeAffiliateUrl: true });
    expect(data.affiliateUrl).toBe("https://www.hostinger.com/vps?ref=secret");
  });
});
