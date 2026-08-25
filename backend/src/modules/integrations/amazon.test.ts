import { describe, expect, it } from "vitest";
import {
  extractAmazonCatalogIds,
  createAmazonAdapter,
  normalizeAmazonItem,
  parseAsins,
  parseAvailability,
  parseMoney,
  taggedAmazonUrl,
  validateNormalizedOffer,
} from "./amazon.js";
import { AdapterDisabledError, type NormalizedOffer } from "./types.js";

function offer(partial: Partial<NormalizedOffer> = {}): NormalizedOffer {
  return {
    externalId: "B08CFJBZRK",
    title: "Prestige Iris",
    price: 4299,
    originalPrice: 4999,
    currency: "INR",
    availability: "IN_STOCK",
    productUrl: "https://www.amazon.in/dp/B08CFJBZRK",
    affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK?tag=test",
    imageUrls: [],
    fetchedAt: new Date("2026-08-24T10:00:00.000Z"),
    ...partial,
  };
}

describe("amazon adapter helpers", () => {
  it("keeps only 10-character ASINs", () => {
    expect(parseAsins(["b08cfjbzrk", "nope", " B00HVXS7WC ", "B00HVXS7WC"])).toEqual(["B08CFJBZRK", "B00HVXS7WC"]);
    const eleven = Array.from({ length: 11 }, (_, index) => `B00000000${index}`.slice(-10).toUpperCase());
    expect(parseAsins(eleven)).toHaveLength(11);
  });

  it("builds tagged Amazon URLs without scraping", () => {
    expect(taggedAmazonUrl("B08CFJBZRK", null)).toBe("https://www.amazon.in/dp/B08CFJBZRK");
    expect(taggedAmazonUrl("B08CFJBZRK", "tag-21")).toBe("https://www.amazon.in/dp/B08CFJBZRK?tag=tag-21");
    const adapter = createAmazonAdapter("tag-21");
    expect(adapter.fallbackUrls?.("B08CFJBZRK", "tag-21")).toEqual({
      productUrl: "https://www.amazon.in/dp/B08CFJBZRK",
      affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK?tag=tag-21",
    });
  });

  it("parses INR money and rejects empty amounts", () => {
    expect(parseMoney({ amount: 2199 })).toBe(2199);
    expect(parseMoney({ displayAmount: "₹1,099.00" })).toBe(1099);
    expect(parseMoney({ amount: 0 })).toBeNull();
    expect(parseMoney(null)).toBeNull();
  });

  it("maps availability text", () => {
    expect(parseAvailability({ message: "In Stock" })).toBe("IN_STOCK");
    expect(parseAvailability({ message: "Currently unavailable" })).toBe("OUT_OF_STOCK");
    expect(parseAvailability({})).toBe("UNKNOWN");
  });

  it("rejects bad price, missing ASIN, and non-INR currency", () => {
    expect(validateNormalizedOffer(offer({ price: 0 }))).toBe("Price must be greater than 0");
    expect(validateNormalizedOffer(offer({ price: null }))).toBe("Price must be greater than 0");
    expect(validateNormalizedOffer(offer({ externalId: "SHORT" }))).toBe("Invalid ASIN");
    expect(validateNormalizedOffer(offer({ currency: "USD" }))).toBe("Currency must be INR");
    expect(validateNormalizedOffer(offer())).toBeNull();
    const adapter = createAmazonAdapter("tag-21");
    expect(adapter.validate(offer({ externalId: "SHORT" }))).toBe("Invalid ASIN");
    expect(adapter.parseExternalIds?.(["sku-1", "B08CFJBZRK"])).toEqual(["B08CFJBZRK"]);
  });

  it("normalizes a Creators-style item without keeping the raw dump", () => {
    const item = normalizeAmazonItem(
      {
        asin: "B08CFJBZRK",
        itemInfo: {
          title: { displayValue: "Prestige Iris 750W" },
          byLineInfo: { brand: { displayValue: "Prestige" } },
        },
        offersV2: { listings: [{ price: { amount: 4299 }, availability: { message: "In Stock" } }] },
        detailPageURL: "https://www.amazon.in/dp/B08CFJBZRK",
      },
      "tag-21",
    );
    expect(item).toMatchObject({
      externalId: "B08CFJBZRK",
      title: "Prestige Iris 750W",
      brand: "Prestige",
      price: 4299,
      currency: "INR",
      availability: "IN_STOCK",
      productUrl: "https://www.amazon.in/dp/B08CFJBZRK",
    });
    expect(item?.affiliateUrl).toContain("tag=tag-21");
    expect(item?.identifiers).toEqual([{ type: "ASIN", value: "B08CFJBZRK" }]);
  });

  it("extracts GTIN/EAN/UPC catalog ids from Creators-style payloads", () => {
    expect(
      extractAmazonCatalogIds({
        itemInfo: { externalIds: { eaNs: { displayValue: "8901234567890" }, upCs: ["012345678905"] } },
      }),
    ).toEqual([
      { type: "EAN", value: "8901234567890" },
      { type: "UPC", value: "012345678905" },
    ]);
  });

  it("is a disabled stub when Creators credentials are missing", async () => {
    const adapter = createAmazonAdapter("tag-21");
    expect(adapter.key).toBe("AMAZON_IN");
    if (!process.env.AMAZON_CREATORS_CREDENTIAL_ID || !process.env.AMAZON_CREATORS_CREDENTIAL_SECRET) {
      expect(adapter.enabled).toBe(false);
      await expect(adapter.lookup(["B08CFJBZRK"])).rejects.toBeInstanceOf(AdapterDisabledError);
      await expect(adapter.search?.("mixer")).rejects.toBeInstanceOf(AdapterDisabledError);
    }
  });
});
