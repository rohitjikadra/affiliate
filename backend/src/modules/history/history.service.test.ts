import { describe, expect, it } from "vitest";
import { dailyLowestPoints, downsampleHistoryPoints, type HistoryPoint } from "./history.service.js";

function point(day: string, price: number, offerId = "a"): HistoryPoint {
  return { offerId, price, currency: "INR", recordedAt: `${day}T12:00:00.000Z` };
}

describe("price history series", () => {
  it("keeps the lowest real snapshot per day", () => {
    const series = dailyLowestPoints([
      point("2026-08-01", 4999, "amazon"),
      point("2026-08-01", 4699, "brand"),
      point("2026-08-02", 4899, "amazon"),
    ]);
    expect(series.map((item) => item.price)).toEqual([4699, 4899]);
  });

  it("downsamples by picking existing points, never interpolating", () => {
    const points = Array.from({ length: 10 }, (_, index) => index + 1);
    expect(downsampleHistoryPoints(points, 4)).toEqual([1, 4, 7, 10]);
    expect(downsampleHistoryPoints(points, 20)).toEqual(points);
  });
});
