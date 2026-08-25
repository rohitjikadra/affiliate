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
  lastCheckedAt: null,
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
    disclosure: "As an Amazon Associate we earn from qualifying purchases.",
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
    expect(data.offers[0]?.merchant.disclosure).toContain("Amazon Associate");
    expect(data.price).toBe("12.00");
    expect(data.lastCheckedAt).toBeNull();
    expect(data.bestOfferId).toBe("o1");
    expect(data.available).toBe(true);
  });

  it("is unavailable without a live offer even if a legacy product URL exists", () => {
    const data = serializeProduct({ ...product, offers: [] });
    expect(data.available).toBe(false);
    expect(data.store).toBe("");
    expect(data.price).toBeNull();
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

  it("uses a cheaper non-primary offer as best price and store, not the recommended Amazon offer", () => {
    const brandOffer = {
      ...amazonOffer,
      id: "o2",
      merchantId: "m2",
      isPrimary: false,
      price: { toString: () => "9.00" } as never,
      merchant: {
        id: "m2",
        slug: "brand-shop",
        name: "Brand shop",
        kind: "DIRECT" as const,
        network: "DIRECT",
        isActive: true,
        disclosure: "Local development merchant. Not a real storefront.",
      },
    };
    const data = serializeProduct({
      ...product,
      offers: [amazonOffer, brandOffer],
    });
    expect(data.price).toBe("9.00");
    expect(data.store).toBe("Brand shop");
    expect(data.bestOfferId).toBe("o2");
    expect(data.primaryOfferId).toBe("o1");
    expect(data.recommendedOfferId).toBe("o1");
    expect(data.offers.find((offer) => offer.id === "o2")?.merchant.disclosure).toBe(
      "Local development merchant. Not a real storefront.",
    );
  });

  it("does not treat a recommended offer as best price when no eligible best exists", () => {
    const staleRecommended = {
      ...amazonOffer,
      lastCheckedAt: new Date("2020-01-01T00:00:00.000Z"),
      lastSuccessfulFetchAt: new Date("2020-01-01T00:00:00.000Z"),
      fetchStatus: "SUCCESS" as const,
    };
    const data = serializeProduct({ ...product, offers: [staleRecommended] });
    expect(data.price).toBeNull();
    expect(data.bestOfferId).toBeNull();
    expect(data.store).toBe("");
    expect(data.recommendedOfferId).toBe("o1");
    expect(data.available).toBe(true);
  });
});
