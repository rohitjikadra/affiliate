import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";

const RANGES: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
const MAX_CHART_POINTS = 90;
const SITE_HISTORY_LABEL = "Prices recorded on this site";

export type HistoryPoint = {
  offerId: string;
  price: number;
  currency: string;
  recordedAt: string;
};

export function dailyLowestPoints(points: HistoryPoint[]): HistoryPoint[] {
  const byDay = new Map<string, HistoryPoint>();
  for (const point of points) {
    const day = point.recordedAt.slice(0, 10);
    const existing = byDay.get(day);
    if (!existing || point.price < existing.price) {
      byDay.set(day, point);
    }
  }
  return [...byDay.values()].sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));
}

export function downsampleHistoryPoints<T>(points: T[], maxPoints = MAX_CHART_POINTS): T[] {
  if (points.length <= maxPoints || maxPoints < 2) {
    return points;
  }
  const result: T[] = [];
  let lastIndex = -1;
  for (let index = 0; index < maxPoints; index += 1) {
    const sourceIndex = Math.round((index * (points.length - 1)) / (maxPoints - 1));
    if (sourceIndex === lastIndex) {
      continue;
    }
    lastIndex = sourceIndex;
    result.push(points[sourceIndex]);
  }
  return result;
}

export async function getPriceHistory(productId: string, range = "30d") {
  if (!env.priceHistoryPublic) {
    return { enabled: false, points: [] as HistoryPoint[], stats: null as null };
  }

  const days = RANGES[range] ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }], isActive: true, status: "PUBLISHED" },
    include: { offers: { select: { id: true } } },
  });
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  const offerIds = product.offers.map((offer) => offer.id);
  const snapshots = offerIds.length
    ? await prisma.priceSnapshot.findMany({
        where: { offerId: { in: offerIds }, recordedAt: { gte: since } },
        orderBy: { recordedAt: "asc" },
        select: { price: true, recordedAt: true, offerId: true, currency: true },
      })
    : [];

  const rawPoints: HistoryPoint[] = snapshots.map((row) => ({
    offerId: row.offerId,
    price: Number(row.price),
    currency: row.currency,
    recordedAt: row.recordedAt.toISOString(),
  })).filter((point) => Number.isFinite(point.price) && point.price > 0);

  const points = downsampleHistoryPoints(dailyLowestPoints(rawPoints));
  const prices = points.map((point) => point.price);
  const stats =
    prices.length === 0
      ? null
      : {
          low: Math.min(...prices),
          high: Math.max(...prices),
          average: Number((prices.reduce((sum, value) => sum + value, 0) / prices.length).toFixed(2)),
          count: prices.length,
          label: SITE_HISTORY_LABEL,
        };

  return { enabled: true, points, stats };
}
