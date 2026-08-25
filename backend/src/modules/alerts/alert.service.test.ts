import { describe, expect, it } from "vitest";
import { createAlertSchema } from "./alert.routes.js";
import { alertMatches } from "./alert.service.js";

describe("createAlertSchema", () => {
  it("requires a target price for TARGET_PRICE", () => {
    const result = createAlertSchema.safeParse({
      productId: "prod_1",
      email: "shopper@example.com",
      type: "TARGET_PRICE",
    });
    expect(result.success).toBe(false);
  });

  it("requires a percent for PERCENT_DROP", () => {
    const result = createAlertSchema.safeParse({
      productId: "prod_1",
      email: "shopper@example.com",
      type: "PERCENT_DROP",
    });
    expect(result.success).toBe(false);
  });

  it("accepts NEW_LOW without extra fields", () => {
    const result = createAlertSchema.safeParse({
      productId: "prod_1",
      email: "shopper@example.com",
      type: "NEW_LOW",
    });
    expect(result.success).toBe(true);
  });

  it("defaults type to TARGET_PRICE", () => {
    const result = createAlertSchema.safeParse({
      productId: "prod_1",
      email: "shopper@example.com",
      targetPrice: 1999,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("TARGET_PRICE");
    }
  });
});

describe("alertMatches", () => {
  it("matches TARGET_PRICE when the current price is at or below the target", () => {
    const alert = { type: "TARGET_PRICE" as const, targetPrice: 4999, percentThreshold: null };
    expect(alertMatches(alert, [{ type: "DROP", percent: -8 }], 4999)).toBe(true);
    expect(alertMatches(alert, [{ type: "DROP", percent: -8 }], 5000)).toBe(false);
    expect(alertMatches({ ...alert, targetPrice: null }, [{ type: "DROP", percent: -8 }], 4000)).toBe(false);
  });

  it("matches PERCENT_DROP only on DROP events that meet the threshold", () => {
    const alert = { type: "PERCENT_DROP" as const, targetPrice: null, percentThreshold: 10 };
    expect(alertMatches(alert, [{ type: "DROP", percent: -12 }], 3999)).toBe(true);
    expect(alertMatches(alert, [{ type: "DROP", percent: -4 }], 3999)).toBe(false);
    expect(alertMatches(alert, [{ type: "RISE", percent: 12 }], 3999)).toBe(false);
  });

  it("matches NEW_LOW only on NEW_LOW events", () => {
    const alert = { type: "NEW_LOW" as const, targetPrice: null, percentThreshold: null };
    expect(alertMatches(alert, [{ type: "NEW_LOW", percent: -6 }], 3499)).toBe(true);
    expect(alertMatches(alert, [{ type: "RETURN_TO_LOW", percent: -6 }], 3499)).toBe(false);
    expect(alertMatches(alert, [{ type: "DROP", percent: -20 }], 3499)).toBe(false);
  });
});
