import { describe, expect, it } from "vitest";
import { serializeProduct } from "./product.serializer.js";

const product = {
  id: "p1",
  slug: "demo",
  title: "Demo",
  description: null,
  pros: null,
  cons: null,
  bestFor: null,
  faq: null,
  brand: "Prestige",
  warranty: "2-year manufacturer warranty",
  specs: [{ label: "Wattage", value: "750 W" }],
  scoreBreakdown: [{ label: "Motor", score: 8 }],
  imageUrl: null,
  images: null,
  price: { toString: () => "10.00" } as never,
  originalPrice: null,
  rating: { toString: () => "4.5" } as never,
  ourScore: { toString: () => "8.0" } as never,
  currency: "INR",
  affiliateUrl: "https://example.com/aff",
  source: "AMAZON" as const,
  sourceId: "B00TEST",
  seoTitle: null,
  seoDescription: null,
  featured: false,
  isActive: true,
  categoryId: null,
  category: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const amazonOffer = {
  id: "o1",
  productId: "p1",
  merchantId: "m1",
  title: null,
  price: { toString: () => "12.00" } as never,
  originalPrice: null,
  currency: "INR",
  affiliateUrl: "https://www.amazon.in/dp/B00TEST?tag=secret",
  externalId: "B00TEST",
  inStock: true,
  isPrimary: true,
  lastCheckedAt: new Date("2026-08-01T00:00:00.000Z"),
  lastSuccessfulFetchAt: null,
  fetchStatus: "NEVER",
  availability: "IN_STOCK",
  productUrl: "https://www.amazon.in/dp/B00TEST",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  merchant: {
    id: "m1",
    slug: "amazon",
    name: "Amazon",
    kind: "MARKETPLACE" as const,
    network: "AMAZON",
    isActive: true,
  },
};

describe("serializeProduct", () => {
  it("hides affiliate URLs by default", () => {
    const data = serializeProduct(product);
    expect(data.affiliateUrl).toBeNull();
    expect(data.sourceId).toBeNull();
    expect(data.ourScore).toBe("8.0");
    expect(data.brand).toBe("Prestige");
    expect(data.specs).toEqual([{ label: "Wattage", value: "750 W" }]);
  });

  it("does not derive Our Score from customer rating", () => {
    const data = serializeProduct({ ...product, ourScore: null });
    expect(data.ourScore).toBeNull();
  });

  it("uses offer price and lastCheckedAt, and hides offer affiliate URLs", () => {
    const data = serializeProduct({
      ...product,
      offers: [amazonOffer],
    });
    expect(data.affiliateUrl).toBeNull();
    expect(data.offers[0]?.affiliateUrl).toBeNull();
    expect(data.store).toBe("Amazon");
    expect(data.price).toBe("12.00");
    expect(data.lastCheckedAt).toBe("2026-08-01T00:00:00.000Z");
    expect(data.available).toBe(true);
  });

  it("is unavailable without a live offer even if a legacy product URL exists", () => {
    const data = serializeProduct({ ...product, offers: [] });
    expect(data.available).toBe(false);
  });

  it("includes affiliate URLs only when asked and there is no offer", () => {
    const data = serializeProduct(product, { includeAffiliateUrl: true });
    expect(data.affiliateUrl).toBe("https://example.com/aff");
    expect(data.sourceId).toBe("B00TEST");
  });

  it("does not expose the product affiliate URL when an offer exists", () => {
    const data = serializeProduct({ ...product, offers: [amazonOffer] }, { includeAffiliateUrl: true });
    expect(data.affiliateUrl).toBeNull();
    expect(data.offers[0]?.affiliateUrl).toBe("https://www.amazon.in/dp/B00TEST?tag=secret");
  });

  it("uses the image gallery and keeps the first URL as cover", () => {
    const data = serializeProduct({
      ...product,
      imageUrl: "https://example.com/cover.jpg",
      images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    });
    expect(data.images).toEqual(["https://example.com/a.jpg", "https://example.com/b.jpg"]);
    expect(data.imageUrl).toBe("https://example.com/a.jpg");
  });

  it("falls back to imageUrl when the gallery is empty", () => {
    const data = serializeProduct({
      ...product,
      imageUrl: "https://example.com/cover.jpg",
      images: [],
    });
    expect(data.images).toEqual(["https://example.com/cover.jpg"]);
    expect(data.imageUrl).toBe("https://example.com/cover.jpg");
  });
});
