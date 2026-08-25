import { describe, expect, it } from "vitest";
import {
  chunkAsins,
  decideImportAction,
  parseImportAsins,
  publishBlockReason,
  taggedAmazonUrl,
} from "./import.match.js";

describe("import matching", () => {
  it("keeps unique 10-character ASINs", () => {
    expect(parseImportAsins(["b08cfjbzrk", "nope", " B00HVXS7WC ", "B00HVXS7WC"])).toEqual([
      "B08CFJBZRK",
      "B00HVXS7WC",
    ]);
  });

  it("batches GetItems-sized chunks of 10", () => {
    const ids = Array.from({ length: 12 }, (_, index) => `B00000000${index}`.slice(-10).toUpperCase());
    expect(chunkAsins(ids, 10)).toHaveLength(2);
    expect(chunkAsins(ids, 10)[0]).toHaveLength(10);
    expect(chunkAsins(ids, 10)[1]).toHaveLength(2);
  });

  it("matches identifier first, then merchant+externalId, then create", () => {
    expect(decideImportAction({ identifierProductId: null, offerId: null })).toBe("create");
    expect(decideImportAction({ identifierProductId: "prod_1", offerId: null })).toBe("attach-offer");
    expect(
      decideImportAction({ identifierProductId: "prod_1", offerId: "offer_1", offerProductId: "prod_1" }),
    ).toBe("refresh-offer");
    expect(
      decideImportAction({ identifierProductId: "prod_1", offerId: "offer_1", offerProductId: "prod_2" }),
    ).toBe("attach-offer");
    expect(decideImportAction({ identifierProductId: null, offerId: "offer_1" })).toBe("refresh-offer");
  });

  it("tags Amazon dp links without scraping", () => {
    expect(taggedAmazonUrl("B08CFJBZRK", null)).toBe("https://www.amazon.in/dp/B08CFJBZRK");
    expect(taggedAmazonUrl("B08CFJBZRK", "tag-21")).toBe("https://www.amazon.in/dp/B08CFJBZRK?tag=tag-21");
  });

  it("blocks publish when there is no offer or safe URL", () => {
    expect(publishBlockReason([])).toBe("Publish requires at least one offer");
    expect(publishBlockReason([{ affiliateUrl: "not-a-url" }])).toBe("Publish requires a valid merchant URL");
    expect(publishBlockReason([{ affiliateUrl: "https://www.amazon.in/dp/B08CFJBZRK" }])).toBeNull();
  });
});
