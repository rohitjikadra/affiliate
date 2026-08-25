import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../lib/errors.js";
import { createFakeAdapter, FAKE_ADAPTER_KEY } from "../integrations/fake.js";
import { registerAdapter } from "../integrations/registry.js";

const { findFirstMerchant, findUniqueMerchant, findUniqueCategory, findFirstIdentifier, findManyIdentifiers, findFirstOffer, findUniqueProduct, createProduct, createOffer, createIdentifier, enqueueJob } =
  vi.hoisted(() => ({
    findFirstMerchant: vi.fn(),
    findUniqueMerchant: vi.fn(),
    findUniqueCategory: vi.fn(),
    findFirstIdentifier: vi.fn(),
    findManyIdentifiers: vi.fn(),
    findFirstOffer: vi.fn(),
    findUniqueProduct: vi.fn(),
    createProduct: vi.fn(),
    createOffer: vi.fn(),
    createIdentifier: vi.fn(),
    enqueueJob: vi.fn(),
  }));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    merchant: { findFirst: findFirstMerchant, findUnique: findUniqueMerchant },
    category: { findUnique: findUniqueCategory },
    productIdentifier: {
      findFirst: findFirstIdentifier,
      findMany: findManyIdentifiers,
      create: createIdentifier,
    },
    offer: { findFirst: findFirstOffer, create: createOffer },
    product: { findUnique: findUniqueProduct, create: createProduct },
  },
}));

vi.mock("../jobs/queue.js", () => ({
  enqueueJob,
}));

import { importAsins, importProducts, parseProductImportPayload } from "./import.service.js";

const amazonMerchant = {
  id: "merchant-amazon",
  slug: "amazon",
  name: "Amazon",
  integrationKey: "AMAZON_IN",
  defaultTag: "tag-21",
  network: "AMAZON",
};

const fakeMerchant = {
  id: "merchant-fake",
  slug: "fixture-shop",
  name: "Fixture Shop",
  integrationKey: FAKE_ADAPTER_KEY,
  defaultTag: null,
  network: "DIRECT",
};

const unsupportedMerchant = {
  id: "merchant-other",
  slug: "other-shop",
  name: "Other Shop",
  integrationKey: "UNSUPPORTED_KEY",
  defaultTag: null,
  network: "DIRECT",
};

describe("product import payload", () => {
  it("accepts legacy { asins } jobs", () => {
    expect(parseProductImportPayload({ asins: ["B08CFJBZRK"], categoryId: "cat-1" })).toEqual({
      merchantId: undefined,
      asins: ["B08CFJBZRK"],
      externalIds: undefined,
      categoryId: "cat-1",
    });
  });

  it("accepts merchantId + externalIds", () => {
    expect(
      parseProductImportPayload({ merchantId: "merchant-1", externalIds: ["SKU-99"], categoryId: null }),
    ).toEqual({
      merchantId: "merchant-1",
      asins: undefined,
      externalIds: ["SKU-99"],
      categoryId: null,
    });
  });
});

describe("import products", () => {
  const unregisters: Array<() => void> = [];

  beforeEach(() => {
    findFirstMerchant.mockReset().mockResolvedValue(amazonMerchant);
    findUniqueMerchant.mockReset();
    findUniqueCategory.mockReset();
    findFirstIdentifier.mockReset().mockResolvedValue(null);
    findManyIdentifiers.mockReset().mockResolvedValue([]);
    findFirstOffer.mockReset().mockResolvedValue(null);
    findUniqueProduct.mockReset().mockResolvedValue(null);
    createProduct.mockReset().mockResolvedValue({
      id: "product-1",
      slug: "amazon-product-b08cfjbzrk",
      status: "DRAFT",
      offers: [{ id: "offer-1" }],
    });
    createOffer.mockReset().mockResolvedValue({ id: "offer-2" });
    createIdentifier.mockReset().mockResolvedValue({});
    enqueueJob.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    while (unregisters.length > 0) {
      unregisters.pop()?.();
    }
  });

  it("creates a DRAFT Amazon product from legacy asins without publishing", async () => {
    const result = await importAsins(["b08cfjbzrk"]);
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Amazon product B08CFJBZRK",
          source: "AMAZON",
          sourceId: "B08CFJBZRK",
          status: "DRAFT",
          isActive: false,
          identifiers: {
            create: [{ type: "ASIN", value: "B08CFJBZRK", merchantId: "merchant-amazon" }],
          },
          offers: {
            create: expect.objectContaining({
              merchantId: "merchant-amazon",
              externalId: "B08CFJBZRK",
              affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK?tag=tag-21",
              productUrl: "https://www.amazon.in/dp/B08CFJBZRK",
              isPrimary: true,
              fetchStatus: "QUEUED",
            }),
          },
        }),
      }),
    );
    expect(result.created).toEqual([
      {
        id: "product-1",
        slug: "amazon-product-b08cfjbzrk",
        asin: "B08CFJBZRK",
        externalId: "B08CFJBZRK",
        status: "DRAFT",
      },
    ]);
    expect(enqueueJob).toHaveBeenCalledWith("PRICE_REFRESH", { offerId: "offer-1" }, { priority: 10 });
  });

  it("rejects a legacy asins payload with no valid ASINs", async () => {
    await expect(importAsins(["nope"])).rejects.toMatchObject({
      statusCode: 400,
      message: "Provide at least one ASIN",
    });
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("rejects an unknown merchantId", async () => {
    findUniqueMerchant.mockResolvedValue(null);
    await expect(importProducts({ merchantId: "missing", externalIds: ["SKU-99"] })).rejects.toBeInstanceOf(AppError);
    await expect(importProducts({ merchantId: "missing", externalIds: ["SKU-99"] })).rejects.toMatchObject({
      message: "Selected merchant does not exist",
    });
  });

  it("rejects a merchant with no registered adapter", async () => {
    findUniqueMerchant.mockResolvedValue(unsupportedMerchant);
    await expect(importProducts({ merchantId: unsupportedMerchant.id, externalIds: ["SKU-99"] })).rejects.toMatchObject({
      message: "This merchant does not support catalog import",
    });
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("imports externalIds through FakeAdapter onto a DRAFT product", async () => {
    unregisters.push(registerAdapter(FAKE_ADAPTER_KEY, () => createFakeAdapter()));
    findUniqueMerchant.mockResolvedValue(fakeMerchant);
    createProduct.mockResolvedValue({
      id: "product-fake",
      slug: "fixture-shop-product-sku-99",
      status: "DRAFT",
      offers: [{ id: "offer-fake" }],
    });

    const result = await importProducts({ merchantId: fakeMerchant.id, externalIds: ["SKU-99"] });

    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Fixture Shop product SKU-99",
          source: "MANUAL",
          sourceId: "SKU-99",
          status: "DRAFT",
          isActive: false,
          identifiers: {
            create: [{ type: "MERCHANT_ID", value: "SKU-99", merchantId: "merchant-fake" }],
          },
          offers: {
            create: expect.objectContaining({
              merchantId: "merchant-fake",
              externalId: "SKU-99",
              affiliateUrl: "https://example.com/p/SKU-99",
              productUrl: "https://example.com/p/SKU-99",
              isPrimary: true,
            }),
          },
        }),
      }),
    );
    expect(result.created[0]).toMatchObject({
      asin: "SKU-99",
      externalId: "SKU-99",
      status: "DRAFT",
    });
    expect(createProduct.mock.calls[0][0].data.offers.create.affiliateUrl).not.toContain("tag=");
  });

  it("reuses the existing product for the same Amazon ASIN", async () => {
    findFirstIdentifier.mockResolvedValue({ productId: "prod-existing", type: "ASIN", value: "B08CFJBZRK" });
    findFirstOffer.mockResolvedValue({ id: "offer-existing", productId: "prod-existing" });
    const result = await importAsins(["B08CFJBZRK"]);
    expect(createProduct).not.toHaveBeenCalled();
    expect(createOffer).not.toHaveBeenCalled();
    expect(result.attached).toEqual([
      {
        productId: "prod-existing",
        asin: "B08CFJBZRK",
        externalId: "B08CFJBZRK",
        action: "refresh-offer",
      },
    ]);
    expect(result.review).toEqual([]);
    expect(findFirstIdentifier).toHaveBeenCalledWith({
      where: { type: "ASIN", value: "B08CFJBZRK" },
    });
    expect(enqueueJob).toHaveBeenCalledWith("PRICE_REFRESH", { offerId: "offer-existing" }, { priority: 10 });
  });

  it("reuses the existing offer for the same merchant + external id", async () => {
    findFirstOffer.mockResolvedValue({ id: "offer-existing", productId: "prod-existing" });
    const result = await importAsins(["B08CFJBZRK"]);
    expect(createProduct).not.toHaveBeenCalled();
    expect(result.attached[0]).toMatchObject({ productId: "prod-existing", action: "refresh-offer" });
  });

  it("attaches a second merchant to the same product when GTIN matches", async () => {
    unregisters.push(
      registerAdapter(
        FAKE_ADAPTER_KEY,
        () =>
          createFakeAdapter({
            items: [
              {
                externalId: "SKU-99",
                title: "Fixture mill",
                price: 1999,
                originalPrice: 2499,
                currency: "INR",
                availability: "IN_STOCK",
                productUrl: "https://example.com/p/SKU-99",
                affiliateUrl: "https://example.com/p/SKU-99",
                imageUrls: [],
                fetchedAt: new Date("2026-08-24T10:00:00.000Z"),
                identifiers: [{ type: "GTIN", value: "8901234567890" }],
              },
            ],
          }),
      ),
    );
    findUniqueMerchant.mockResolvedValue(fakeMerchant);
    findManyIdentifiers.mockResolvedValue([{ productId: "canonical-product" }]);
    const result = await importProducts({ merchantId: fakeMerchant.id, externalIds: ["SKU-99"] });
    expect(createProduct).not.toHaveBeenCalled();
    expect(createOffer).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: "canonical-product",
          merchantId: "merchant-fake",
          externalId: "SKU-99",
        }),
      }),
    );
    expect(result.attached).toEqual([
      {
        productId: "canonical-product",
        asin: "SKU-99",
        externalId: "SKU-99",
        action: "attach-offer",
      },
    ]);
    expect(result.review).toEqual([]);
    expect(createOffer.mock.calls[0][0].data.isPrimary).toBeUndefined();
  });

  it("does not auto-merge when GTIN and listing identifiers point at different products", async () => {
    unregisters.push(
      registerAdapter(
        FAKE_ADAPTER_KEY,
        () =>
          createFakeAdapter({
            items: [
              {
                externalId: "SKU-99",
                title: "Fixture mill",
                price: 1999,
                originalPrice: 2499,
                currency: "INR",
                availability: "IN_STOCK",
                productUrl: "https://example.com/p/SKU-99",
                affiliateUrl: "https://example.com/p/SKU-99",
                imageUrls: [],
                fetchedAt: new Date("2026-08-24T10:00:00.000Z"),
                identifiers: [{ type: "GTIN", value: "8901234567890" }],
              },
            ],
          }),
      ),
    );
    findUniqueMerchant.mockResolvedValue(fakeMerchant);
    findManyIdentifiers.mockResolvedValue([{ productId: "prod-gtin" }]);
    findFirstIdentifier.mockResolvedValue({ productId: "prod-sku", type: "MERCHANT_ID", value: "SKU-99" });
    const result = await importProducts({ merchantId: fakeMerchant.id, externalIds: ["SKU-99"] });
    expect(createProduct).not.toHaveBeenCalled();
    expect(createOffer).not.toHaveBeenCalled();
    expect(result.created).toEqual([]);
    expect(result.attached).toEqual([]);
    expect(result.review).toEqual([
      {
        productIds: ["prod-gtin", "prod-sku"],
        asin: "SKU-99",
        externalId: "SKU-99",
        reason: "ambiguous-match",
      },
    ]);
  });

  it("does not auto-merge when the same GTIN is already on two products", async () => {
    unregisters.push(
      registerAdapter(
        FAKE_ADAPTER_KEY,
        () =>
          createFakeAdapter({
            items: [
              {
                externalId: "SKU-99",
                title: "Fixture mill",
                price: 1999,
                originalPrice: 2499,
                currency: "INR",
                availability: "IN_STOCK",
                productUrl: "https://example.com/p/SKU-99",
                affiliateUrl: "https://example.com/p/SKU-99",
                imageUrls: [],
                fetchedAt: new Date("2026-08-24T10:00:00.000Z"),
                identifiers: [{ type: "GTIN", value: "8901234567890" }],
              },
            ],
          }),
      ),
    );
    findUniqueMerchant.mockResolvedValue(fakeMerchant);
    findManyIdentifiers.mockResolvedValue([{ productId: "prod-a" }, { productId: "prod-b" }]);
    const result = await importProducts({ merchantId: fakeMerchant.id, externalIds: ["SKU-99"] });
    expect(createProduct).not.toHaveBeenCalled();
    expect(createOffer).not.toHaveBeenCalled();
    expect(result.review).toEqual([
      {
        productIds: ["prod-a", "prod-b"],
        asin: "SKU-99",
        externalId: "SKU-99",
        reason: "ambiguous-match",
      },
    ]);
  });

  it("scopes merchant SKUs so two merchants can share the same listing id", async () => {
    unregisters.push(registerAdapter(FAKE_ADAPTER_KEY, () => createFakeAdapter()));
    findUniqueMerchant.mockResolvedValue(fakeMerchant);
    const result = await importProducts({ merchantId: fakeMerchant.id, externalIds: ["SKU-99"] });
    expect(findFirstIdentifier).toHaveBeenCalledWith({
      where: { type: "MERCHANT_ID", value: "SKU-99", merchantId: "merchant-fake" },
    });
    expect(result.created[0]?.status).toBe("DRAFT");
  });
});
