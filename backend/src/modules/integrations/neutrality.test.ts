import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("merchant-neutral core imports", () => {
  it("does not import Amazon helpers from generic refresh, click, offer, or match paths", () => {
    const refresh = source("jobs/refresh.ts");
    const click = source("clicks/click.service.ts");
    const offer = source("offers/offer.service.ts");
    const match = source("imports/import.match.ts");

    for (const [name, contents] of [
      ["refresh.ts", refresh],
      ["click.service.ts", click],
      ["offer.service.ts", offer],
      ["import.match.ts", match],
    ] as const) {
      expect(contents, name).not.toMatch(/integrations\/amazon/);
      expect(contents, name).not.toMatch(/affiliates\/amazon/);
      expect(contents, name).not.toMatch(/applyAmazonTag/);
      expect(contents, name).not.toMatch(/validateNormalizedOffer/);
      expect(contents, name).not.toMatch(/taggedAmazonUrl/);
      expect(contents, name).not.toMatch(/parseAsins/);
    }

    expect(refresh).toContain("adapter.validate");
    expect(refresh).toContain('source: "WORKER"');
    expect(click).toContain("resolveAffiliateUrl");
    expect(offer).toContain("resolveAffiliateUrl");
  });
});
