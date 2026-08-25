import { describe, expect, it } from "vitest";
import { amazonAffiliateResolver } from "./amazon.js";
import { getAffiliateResolver, passthroughAffiliateResolver, resolveAffiliateUrl } from "./resolve.js";

describe("affiliate resolver", () => {
  const amazonUrl = "https://www.amazon.in/dp/B00TEST";
  const otherUrl = "https://www.example.com/p/SKU-99";

  it("selects the Amazon resolver by integration key, network, or slug", () => {
    expect(getAffiliateResolver({ integrationKey: "AMAZON_IN" }).key).toBe("AMAZON");
    expect(getAffiliateResolver({ network: "AMAZON" }).key).toBe("AMAZON");
    expect(getAffiliateResolver({ slug: "amazon" }).key).toBe("AMAZON");
  });

  it("falls back to passthrough for other merchants", () => {
    expect(getAffiliateResolver({ integrationKey: "FAKE_TEST", slug: "fixture-shop" })).toBe(
      passthroughAffiliateResolver,
    );
  });

  it("injects an Amazon tag for Amazon offers", () => {
    const tagged = resolveAffiliateUrl(amazonUrl, {
      integrationKey: "AMAZON_IN",
      network: "AMAZON",
      slug: "amazon",
      defaultTag: "tag-21",
    });
    expect(tagged).toContain("tag=tag-21");
    expect(amazonAffiliateResolver.resolve({ url: amazonUrl, merchant: { defaultTag: "tag-21" } })).toContain(
      "tag=tag-21",
    );
  });

  it("does not rewrite a non-Amazon merchant URL", () => {
    expect(
      resolveAffiliateUrl(otherUrl, {
        integrationKey: "FAKE_TEST",
        slug: "fixture-shop",
        defaultTag: "tag-21",
      }),
    ).toBe(otherUrl);
  });

  it("does not add an Amazon tag to a non-Amazon URL even for an Amazon merchant", () => {
    expect(
      resolveAffiliateUrl(otherUrl, {
        integrationKey: "AMAZON_IN",
        defaultTag: "tag-21",
      }),
    ).toBe(otherUrl);
  });
});
