import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateNormalizedOffer } from "../integrations/amazon.js";
import { createFakeAdapter, FAKE_ADAPTER_KEY } from "../integrations/fake.js";
import { registerAdapter } from "../integrations/registry.js";
import type { MerchantAdapter, NormalizedOffer } from "../integrations/types.js";
import { AdapterDisabledError } from "../integrations/types.js";

const { findUnique, update, enqueueJob, recordPriceSnapshot, recordPriceEvents } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  enqueueJob: vi.fn(),
  recordPriceSnapshot: vi.fn(),
  recordPriceEvents: vi.fn(),
}));

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    offer: {
      findUnique,
      update,
    },
  },
}));

vi.mock("./queue.js", () => ({
  enqueueJob,
}));

vi.mock("../pricing/snapshot.js", () => ({
  recordPriceSnapshot,
}));

vi.mock("../pricing/events.js", () => ({
  recordPriceEvents,
}));

import { nextFailureAt, nextSuccessAt, refreshOffer, shouldPauseFetching } from "./refresh.js";

function offerRow(partial: Record<string, unknown> = {}) {
  return {
    id: "offer-1",
    productId: "product-1",
    externalId: "B08CFJBZRK",
    title: "Prestige Iris",
    price: "4299",
    originalPrice: null,
    affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK",
    inStock: true,
    consecutiveFailures: 0,
    merchant: { integrationKey: "AMAZON_IN", defaultTag: "tag-21", fetchEnabled: true },
    product: { id: "product-1", slug: "prestige-iris-750w-mixer-grinder" },
    ...partial,
  };
}

function item(partial: Partial<NormalizedOffer> = {}): NormalizedOffer {
  return {
    externalId: "B08CFJBZRK",
    title: "Prestige Iris",
    price: 4199,
    originalPrice: 4999,
    currency: "INR",
    availability: "IN_STOCK",
    productUrl: "https://www.amazon.in/dp/B08CFJBZRK",
    affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK?tag=tag-21",
    imageUrls: [],
    fetchedAt: new Date("2026-08-24T10:00:00.000Z"),
    ...partial,
  };
}

function mockAdapter(
  lookup: MerchantAdapter["lookup"],
  enabled = true,
  validate: MerchantAdapter["validate"] = validateNormalizedOffer,
): MerchantAdapter {
  return { key: "AMAZON_IN", enabled, lookup, validate };
}

describe("price refresh", () => {
  const unregisters: Array<() => void> = [];

  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset().mockResolvedValue({});
    enqueueJob.mockReset().mockResolvedValue({});
    recordPriceSnapshot.mockReset().mockResolvedValue(true);
    recordPriceEvents.mockReset().mockResolvedValue([]);
  });

  afterEach(() => {
    while (unregisters.length > 0) {
      unregisters.pop()?.();
    }
  });

  it("backs off exponentially and pauses after 8 failures", () => {
    const now = Date.parse("2026-08-24T10:00:00.000Z");
    expect(nextFailureAt(1, now).getTime() - now).toBe(5 * 60 * 1000);
    expect(nextFailureAt(2, now).getTime() - now).toBe(10 * 60 * 1000);
    expect(nextFailureAt(10, now).getTime() - now).toBe(24 * 60 * 60 * 1000);
    expect(shouldPauseFetching(7)).toBe(false);
    expect(shouldPauseFetching(8)).toBe(true);
    const success = nextSuccessAt(now).getTime() - now;
    expect(success).toBeGreaterThanOrEqual(45 * 60 * 1000);
    expect(success).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it("marks NEVER when the adapter is disabled and does not look up", async () => {
    findUnique.mockResolvedValue(offerRow());
    const lookup = vi.fn();
    await refreshOffer("offer-1", mockAdapter(lookup, false));
    expect(lookup).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "NEVER" }),
    });
    expect(recordPriceSnapshot).not.toHaveBeenCalled();
  });

  it("marks INVALID for a missing ASIN without calling lookup", async () => {
    findUnique.mockResolvedValue(offerRow({ externalId: "" }));
    const lookup = vi.fn();
    await refreshOffer("offer-1", mockAdapter(lookup));
    expect(lookup).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "INVALID", nextFetchAt: null }),
    });
  });

  it("marks INVALID for a bad price or non-INR currency", async () => {
    findUnique.mockResolvedValue(offerRow());
    await refreshOffer("offer-1", mockAdapter(async () => [item({ price: 0 })]));
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "INVALID", fetchError: "Price must be greater than 0", nextFetchAt: null }),
    });

    update.mockClear();
    await refreshOffer("offer-1", mockAdapter(async () => [item({ currency: "USD" })]));
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "INVALID", fetchError: "Currency must be INR" }),
    });
  });

  it("writes the offer and a snapshot when lookup succeeds", async () => {
    findUnique.mockResolvedValue(offerRow());
    await refreshOffer("offer-1", mockAdapter(async () => [item()]));
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({
        price: 4199,
        fetchStatus: "SUCCESS",
        consecutiveFailures: 0,
        availability: "IN_STOCK",
      }),
    });
    expect(recordPriceSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        offerId: "offer-1",
        price: 4199,
        source: "WORKER",
        fetchStatus: "SUCCESS",
      }),
    );
    expect(enqueueJob).toHaveBeenCalledWith(
      "REVALIDATE",
      {
        path: "/products/prestige-iris-750w-mixer-grinder",
        paths: ["/products/prestige-iris-750w-mixer-grinder", "/products"],
      },
      { priority: 1 },
    );
  });

  it("marks RATE_LIMITED on 429 and pauses after 8 consecutive failures", async () => {
    findUnique.mockResolvedValue(offerRow({ consecutiveFailures: 7 }));
    await expect(
      refreshOffer(
        "offer-1",
        mockAdapter(async () => {
          throw new Error("Amazon GetItems failed (429)");
        }),
      ),
    ).rejects.toThrow("429");
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({
        fetchStatus: "RATE_LIMITED",
        consecutiveFailures: 8,
        nextFetchAt: null,
      }),
    });
  });

  it("treats AdapterDisabledError as NEVER", async () => {
    findUnique.mockResolvedValue(offerRow());
    await refreshOffer(
      "offer-1",
      mockAdapter(async () => {
        throw new AdapterDisabledError("AMAZON_IN");
      }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "NEVER" }),
    });
  });

  it("uses the FakeAdapter validator and writes a WORKER snapshot for non-ASIN ids", async () => {
    findUnique.mockResolvedValue(
      offerRow({
        externalId: "SKU-99",
        merchant: { integrationKey: "FAKE_TEST", defaultTag: null, fetchEnabled: true },
      }),
    );
    const fakeItem = item({
      externalId: "SKU-99",
      currency: "USD",
      productUrl: "https://example.com/p/SKU-99",
      affiliateUrl: "https://example.com/p/SKU-99",
    });
    await refreshOffer(
      "offer-1",
      createFakeAdapter({
        lookup: async () => [fakeItem],
      }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({
        price: 4199,
        currency: "USD",
        fetchStatus: "SUCCESS",
      }),
    });
    expect(recordPriceSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        offerId: "offer-1",
        price: 4199,
        source: "WORKER",
      }),
    );
  });

  it("does not apply Amazon ASIN rules to a FakeAdapter offer", async () => {
    findUnique.mockResolvedValue(offerRow({ externalId: "SKU-99" }));
    await refreshOffer(
      "offer-1",
      createFakeAdapter({
        lookup: async () => [item({ externalId: "SKU-99", currency: "USD" })],
      }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "SUCCESS" }),
    });
    expect(update).not.toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "INVALID" }),
    });
  });

  it("selects the FakeAdapter from the registry by merchant integration key", async () => {
    const fakeItem = item({
      externalId: "SKU-99",
      currency: "INR",
      productUrl: "https://example.com/p/SKU-99",
      affiliateUrl: "https://example.com/p/SKU-99",
    });
    unregisters.push(
      registerAdapter(FAKE_ADAPTER_KEY, () =>
        createFakeAdapter({
          lookup: async () => [fakeItem],
        }),
      ),
    );
    findUnique.mockResolvedValue(
      offerRow({
        externalId: "SKU-99",
        merchant: { integrationKey: FAKE_ADAPTER_KEY, defaultTag: null, fetchEnabled: true },
      }),
    );
    await refreshOffer("offer-1");
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "SUCCESS", price: 4199 }),
    });
    expect(recordPriceSnapshot).toHaveBeenCalledWith(expect.objectContaining({ source: "WORKER" }));
  });

  it("marks NEVER when no adapter is registered for the merchant", async () => {
    findUnique.mockResolvedValue(
      offerRow({
        merchant: { integrationKey: "UNKNOWN_MERCHANT", defaultTag: null, fetchEnabled: true },
      }),
    );
    await refreshOffer("offer-1");
    expect(update).toHaveBeenCalledWith({
      where: { id: "offer-1" },
      data: expect.objectContaining({ fetchStatus: "NEVER" }),
    });
    expect(recordPriceSnapshot).not.toHaveBeenCalled();
  });
});
