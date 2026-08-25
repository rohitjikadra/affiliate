import { afterEach, describe, expect, it } from "vitest";
import { createFakeAdapter, FAKE_ADAPTER_KEY } from "./fake.js";
import { getAdapter, registerAdapter } from "./registry.js";

describe("adapter registry", () => {
  const unregisters: Array<() => void> = [];

  afterEach(() => {
    while (unregisters.length > 0) {
      unregisters.pop()?.();
    }
  });

  it("returns the Amazon adapter by integration key", () => {
    const adapter = getAdapter("AMAZON_IN", "tag-21");
    expect(adapter?.key).toBe("AMAZON_IN");
    expect(typeof adapter?.validate).toBe("function");
  });

  it("returns null for an unknown merchant key", () => {
    expect(getAdapter("FLIPKART_IN")).toBeNull();
    expect(getAdapter("")).toBeNull();
  });

  it("selects a registered FakeAdapter by integration key", async () => {
    const fake = createFakeAdapter({
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
        },
      ],
    });
    unregisters.push(registerAdapter(FAKE_ADAPTER_KEY, () => fake));

    const adapter = getAdapter(FAKE_ADAPTER_KEY);
    expect(adapter?.key).toBe(FAKE_ADAPTER_KEY);
    const [item] = (await adapter?.lookup(["SKU-99"])) ?? [];
    expect(item?.externalId).toBe("SKU-99");
    expect(adapter?.validate(item!)).toBeNull();
    expect(adapter?.validate({ ...item!, externalId: "SHORT" })).toBeNull();
    expect(adapter?.validate({ ...item!, price: 0 })).toBe("Price must be greater than 0");
  });
});
