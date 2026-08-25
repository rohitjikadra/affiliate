import { describe, expect, it } from "vitest";
import { shouldRecordSnapshot, snapshotIdsToDrop } from "./snapshot.js";

const now = Date.parse("2026-08-24T10:00:00.000Z");

describe("price snapshots", () => {
  it("writes the first observation", () => {
    expect(shouldRecordSnapshot(null, { price: 4299, availability: "IN_STOCK", inStock: true }, now)).toBe(true);
  });

  it("skips an unchanged recent price", () => {
    expect(
      shouldRecordSnapshot(
        { price: 4299, availability: "IN_STOCK", inStock: true, recordedAt: new Date(now - 10 * 60 * 1000) },
        { price: 4299, availability: "IN_STOCK", inStock: true },
        now,
      ),
    ).toBe(false);
  });

  it("writes again when the price, stock, or availability changes", () => {
    const previous = { price: 4299, availability: "IN_STOCK" as const, inStock: true, recordedAt: new Date(now - 10 * 60 * 1000) };
    expect(shouldRecordSnapshot(previous, { price: 3999, availability: "IN_STOCK", inStock: true }, now)).toBe(true);
    expect(shouldRecordSnapshot(previous, { price: 4299, availability: "OUT_OF_STOCK", inStock: false }, now)).toBe(true);
  });

  it("writes a daily point after the 6-hour window even if the price is unchanged", () => {
    expect(
      shouldRecordSnapshot(
        { price: 4299, availability: "IN_STOCK", inStock: true, recordedAt: new Date(now - 7 * 60 * 60 * 1000) },
        { price: 4299, availability: "IN_STOCK", inStock: true },
        now,
      ),
    ).toBe(true);
  });

  it("keeps one real snapshot per offer per UTC day when compacting", () => {
    const offerId = "offer-1";
    const ids = snapshotIdsToDrop([
      { id: "keep-morning", offerId, recordedAt: new Date("2026-01-01T01:00:00.000Z") },
      { id: "drop-afternoon", offerId, recordedAt: new Date("2026-01-01T15:00:00.000Z") },
      { id: "keep-next", offerId, recordedAt: new Date("2026-01-02T01:00:00.000Z") },
    ]);
    expect(ids).toEqual(["drop-afternoon"]);
  });
});
