import { describe, expect, it } from "vitest";
import { selectBestOffer, selectBuyableOffer, selectCheckoutOffer, summarizeBestPrice } from "./best-price.js";

const now = Date.parse("2026-08-24T10:00:00.000Z");

function offer(partial: Record<string, unknown> = {}) {
  return {
    id: "a",
    price: "4999",
    originalPrice: "5999",
    currency: "INR",
    inStock: true,
    lastCheckedAt: new Date(now - 10 * 60 * 1000),
    lastSuccessfulFetchAt: new Date(now - 10 * 60 * 1000),
    fetchStatus: "SUCCESS",
    merchant: { isActive: true, name: "Amazon" },
    ...partial,
  };
}

describe("best price", () => {
  it("picks the cheapest fresh in-stock offer", () => {
    const best = selectBestOffer(
      [
        offer({ id: "amazon", price: "4299", merchant: { isActive: true, name: "Amazon" } }),
        offer({ id: "other", price: "3999", merchant: { isActive: true, name: "Brand" } }),
      ],
      now,
    );
    expect(best?.id).toBe("other");
  });

  it("ignores isPrimary, Amazon, and recommended flags when picking best price", () => {
    const best = selectBestOffer(
      [
        offer({
          id: "amazon-recommended",
          price: "5299",
          isPrimary: true,
          merchant: { isActive: true, name: "Amazon" },
        }),
        offer({
          id: "cheaper",
          price: "3999",
          isPrimary: false,
          merchant: { isActive: true, name: "Brand shop" },
        }),
      ],
      now,
    );
    expect(best?.id).toBe("cheaper");
  });

  it("uses recommended only as a buyable checkout fallback, never as best price", () => {
    const staleRecommended = offer({
      id: "recommended",
      price: "5299",
      isPrimary: true,
      lastCheckedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      lastSuccessfulFetchAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      merchant: { isActive: true, name: "Amazon" },
    });
    const staleCheaper = offer({
      id: "cheaper-stale",
      price: "3999",
      isPrimary: false,
      lastCheckedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      lastSuccessfulFetchAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      merchant: { isActive: true, name: "Brand shop" },
    });
    expect(selectBestOffer([staleRecommended, staleCheaper], now)).toBeNull();
    expect(selectBuyableOffer([staleRecommended, staleCheaper])?.id).toBe("recommended");
    expect(selectCheckoutOffer([staleRecommended, staleCheaper], now)?.id).toBe("recommended");
  });

  it("skips out-of-stock and stale offers", () => {
    const best = selectBestOffer(
      [
        offer({ id: "oos", price: "1", inStock: false }),
        offer({
          id: "stale",
          price: "2",
          lastCheckedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
          lastSuccessfulFetchAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
        }),
        offer({ id: "ok", price: "5000" }),
      ],
      now,
    );
    expect(best?.id).toBe("ok");
  });

  it("allows never-fetched manual offers", () => {
    const best = selectBestOffer(
      [offer({ id: "manual", fetchStatus: "NEVER", lastCheckedAt: null, lastSuccessfulFetchAt: null, price: "3200" })],
      now,
    );
    expect(best?.id).toBe("manual");
  });

  it("summarizes empty catalogs without inventing a price", () => {
    expect(summarizeBestPrice([], "INR", now).price).toBeNull();
  });
});
