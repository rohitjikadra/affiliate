import { describe, expect, it } from "vitest";
import { applyAmazonTag, amazonAffiliateResolver, isAmazonUrl } from "./amazon.js";

describe("amazon adapter", () => {
  it("adds a missing tag on Amazon URLs", () => {
    expect(applyAmazonTag("https://www.amazon.in/dp/B00TEST", "affiliatehub-21")).toContain(
      "tag=affiliatehub-21",
    );
  });

  it("does not rewrite non-Amazon URLs", () => {
    const url = "https://www.hostinger.com/vps-hosting";
    expect(applyAmazonTag(url, "affiliatehub-21")).toBe(url);
  });

  it("detects Amazon hosts", () => {
    expect(isAmazonUrl("https://www.amazon.in/dp/B00TEST")).toBe(true);
    expect(isAmazonUrl("https://www.hostinger.com")).toBe(false);
  });

  it("is used by the Amazon affiliate resolver", () => {
    expect(
      amazonAffiliateResolver.resolve({
        url: "https://www.amazon.in/dp/B00TEST",
        merchant: { defaultTag: "affiliatehub-21" },
      }),
    ).toContain("tag=affiliatehub-21");
  });
});
