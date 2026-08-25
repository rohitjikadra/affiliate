import { describe, expect, it } from "vitest";
import {
  chunkIds,
  decideImportAction,
  normalizeIdentifierValue,
  publishBlockReason,
  uniqueIdentifierRefs,
} from "./import.match.js";

describe("import matching", () => {
  it("batches lookup-sized chunks of 10", () => {
    const ids = Array.from({ length: 12 }, (_, index) => `B00000000${index}`.slice(-10).toUpperCase());
    expect(chunkIds(ids, 10)).toHaveLength(2);
    expect(chunkIds(ids, 10)[0]).toHaveLength(10);
    expect(chunkIds(ids, 10)[1]).toHaveLength(2);
  });

  it("normalizes global catalog ids and de-duplicates identifier refs", () => {
    expect(normalizeIdentifierValue("GTIN", " 890-1234 ")).toBe("8901234");
    expect(normalizeIdentifierValue("ASIN", "b08cfjbzrk")).toBe("B08CFJBZRK");
    expect(normalizeIdentifierValue("MERCHANT_ID", " SKU-99 ")).toBe("SKU-99");
    expect(
      uniqueIdentifierRefs([
        { type: "GTIN", value: "8901234567890" },
        { type: "GTIN", value: "890-1234-567890" },
        { type: "ASIN", value: "b08cfjbzrk" },
      ]),
    ).toEqual([
      { type: "GTIN", value: "8901234567890" },
      { type: "ASIN", value: "B08CFJBZRK" },
    ]);
  });

  it("matches identifier first, then merchant+externalId, then create", () => {
    expect(decideImportAction({ identifierProductId: null, offerId: null })).toBe("create");
    expect(decideImportAction({ identifierProductId: "prod_1", offerId: null })).toBe("attach-offer");
    expect(
      decideImportAction({ identifierProductId: "prod_1", offerId: "offer_1", offerProductId: "prod_1" }),
    ).toBe("refresh-offer");
    expect(
      decideImportAction({ identifierProductId: "prod_1", offerId: "offer_1", offerProductId: "prod_2" }),
    ).toBe("review");
    expect(decideImportAction({ identifierProductId: null, offerId: "offer_1" })).toBe("refresh-offer");
    expect(
      decideImportAction({
        globalProductId: "prod_1",
        identifierProductId: null,
        offerId: null,
      }),
    ).toBe("attach-offer");
    expect(
      decideImportAction({
        globalProductId: "prod_1",
        identifierProductId: "prod_2",
        offerId: null,
      }),
    ).toBe("review");
  });

  it("blocks publish when there is no offer or safe URL", () => {
    expect(publishBlockReason([])).toBe("Publish requires at least one offer");
    expect(publishBlockReason([{ affiliateUrl: "not-a-url" }])).toBe("Publish requires a valid merchant URL");
    expect(publishBlockReason([{ affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK" }])).toBeNull();
  });
});
