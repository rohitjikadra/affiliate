import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, findFirstProduct, createClick } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirstProduct: vi.fn(),
  createClick: vi.fn(),
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    offer: { findUnique },
    product: { findFirst: findFirstProduct },
    affiliateClick: { create: createClick },
  },
}));

import { recordOfferClick, recordProductClick } from "./click.service.js";

function offerRow(partial: Record<string, unknown> = {}) {
  return {
    id: "offer-1",
    productId: "product-1",
    merchantId: "merchant-1",
    affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK",
    inStock: true,
    merchant: {
      isActive: true,
      defaultTag: "tag-21",
      network: "AMAZON",
      integrationKey: "AMAZON_IN",
      slug: "amazon",
      hostAllowlist: ["amazon.in", "www.amazon.in"],
    },
    product: { id: "product-1", isActive: true, status: "PUBLISHED", source: "AMAZON" },
    ...partial,
  };
}

describe("offer click redirect", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findFirstProduct.mockReset();
    createClick.mockReset().mockResolvedValue({});
  });

  it("tags Amazon destinations through the affiliate resolver", async () => {
    findUnique.mockResolvedValue(offerRow());
    const result = await recordOfferClick("offer-1", {});
    expect(result.url).toContain("tag=tag-21");
    expect(createClick).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: "AMAZON", offerId: "offer-1" }),
      }),
    );
  });

  it("leaves a non-Amazon merchant URL unchanged", async () => {
    const url = "https://example.com/p/SKU-99";
    findUnique.mockResolvedValue(
      offerRow({
        affiliateUrl: url,
        merchant: {
          isActive: true,
          defaultTag: "tag-21",
          network: "DIRECT",
          integrationKey: "FAKE_TEST",
          slug: "fixture-shop",
          hostAllowlist: ["example.com"],
        },
      }),
    );
    const result = await recordOfferClick("offer-1", {});
    expect(result.url).toBe(url);
    expect(result.url).not.toContain("tag=");
    expect(createClick).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: "MANUAL" }),
      }),
    );
  });

  it("blocks checkout when the merchant host allowlist is empty", async () => {
    findUnique.mockResolvedValue(
      offerRow({
        merchant: {
          isActive: true,
          defaultTag: "tag-21",
          network: "AMAZON",
          integrationKey: "AMAZON_IN",
          slug: "amazon",
          hostAllowlist: [],
        },
      }),
    );
    await expect(recordOfferClick("offer-1", {})).rejects.toMatchObject({
      statusCode: 409,
      message: "This offer is currently unavailable.",
    });
    expect(createClick).not.toHaveBeenCalled();
  });
});

describe("product click fallback", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findFirstProduct.mockReset();
    createClick.mockReset().mockResolvedValue({});
  });

  it("checks out the cheapest eligible offer, not the recommended Amazon offer", async () => {
    const recommended = offerRow({
      id: "amazon-recommended",
      price: "5299",
      isPrimary: true,
      inStock: true,
      lastSuccessfulFetchAt: new Date(),
      fetchStatus: "SUCCESS",
    });
    const cheaper = offerRow({
      id: "cheaper",
      price: "3999",
      isPrimary: false,
      inStock: true,
      lastSuccessfulFetchAt: new Date(),
      fetchStatus: "SUCCESS",
      affiliateUrl: "https://example.com/p/SKU-99",
      merchant: {
        isActive: true,
        defaultTag: null,
        network: "DIRECT",
        integrationKey: "FAKE_TEST",
        slug: "fixture-shop",
        hostAllowlist: ["example.com"],
      },
    });
    findFirstProduct.mockResolvedValue({
      id: "product-1",
      isActive: true,
      status: "PUBLISHED",
      source: "AMAZON",
      affiliateUrl: null,
      offers: [recommended, cheaper],
    });
    findUnique.mockResolvedValue(cheaper);
    const result = await recordProductClick("demo", {});
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cheaper" } }));
    expect(result.url).toBe("https://example.com/p/SKU-99");
    expect(createClick).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: "MANUAL", offerId: "cheaper" }),
      }),
    );
  });

  it("keeps product-level /go on Product.affiliateUrl when there are no offers", async () => {
    findFirstProduct.mockResolvedValue({
      id: "product-1",
      isActive: true,
      status: "PUBLISHED",
      source: "AMAZON",
      affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK",
      offers: [],
    });
    const result = await recordProductClick("demo", {});
    expect(result.url).toBe("https://www.amazon.in/dp/B08CFJBZRK");
    expect(createClick).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ source: "AMAZON", productId: "product-1" }),
      }),
    );
  });
});
