import { prisma } from "../../config/prisma.js";
import type { AvailabilityStatus, OfferFetchStatus, SnapshotSource } from "../../generated/prisma/client.js";

type SnapshotInput = {
  offerId: string;
  price: number | null | undefined;
  currency: string;
  originalPrice?: number | null;
  availability?: AvailabilityStatus | null;
  inStock?: boolean | null;
  source?: SnapshotSource;
  fetchStatus?: OfferFetchStatus | null;
};

type PreviousSnapshot = {
  price: { toString(): string } | number;
  availability?: AvailabilityStatus | null;
  inStock?: boolean | null;
  recordedAt: Date;
};

export function shouldRecordSnapshot(
  previous: PreviousSnapshot | null,
  input: { price: number; availability?: AvailabilityStatus | null; inStock?: boolean | null },
  now = Date.now(),
): boolean {
  if (previous == null) {
    return true;
  }
  const samePrice = Number(previous.price) === input.price;
  const sameAvailability = (previous.availability ?? null) === (input.availability ?? null);
  const sameStock = (previous.inStock ?? null) === (input.inStock ?? null);
  const recent = now - previous.recordedAt.getTime() < 6 * 60 * 60 * 1000;
  return !(samePrice && sameAvailability && sameStock && recent);
}

export function snapshotIdsToDrop(
  rows: { id: string; offerId: string; recordedAt: Date }[],
): string[] {
  const keep = new Set<string>();
  const seenDay = new Set<string>();
  for (const row of rows) {
    const day = `${row.offerId}:${row.recordedAt.toISOString().slice(0, 10)}`;
    if (!seenDay.has(day)) {
      seenDay.add(day);
      keep.add(row.id);
    }
  }
  return rows.filter((row) => !keep.has(row.id)).map((row) => row.id);
}

export async function recordPriceSnapshot(input: SnapshotInput): Promise<boolean> {
  if (input.price == null || !Number.isFinite(input.price) || input.price <= 0) {
    return false;
  }

  const previous = await prisma.priceSnapshot.findFirst({
    where: { offerId: input.offerId },
    orderBy: { recordedAt: "desc" },
  });

  if (!shouldRecordSnapshot(previous, { price: input.price, availability: input.availability, inStock: input.inStock })) {
    return false;
  }

  await prisma.priceSnapshot.create({
    data: {
      offerId: input.offerId,
      price: input.price,
      currency: input.currency,
      originalPrice: input.originalPrice ?? null,
      availability: input.availability ?? null,
      inStock: input.inStock ?? null,
      source: input.source ?? "ADMIN",
      fetchStatus: input.fetchStatus ?? null,
    },
  });
  return true;
}

export async function compactOldSnapshots(retainDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000);
  const old = await prisma.priceSnapshot.findMany({
    where: { recordedAt: { lt: cutoff } },
    orderBy: [{ offerId: "asc" }, { recordedAt: "asc" }],
    select: { id: true, offerId: true, recordedAt: true },
  });

  const ids = snapshotIdsToDrop(old);
  let deleted = 0;
  for (let index = 0; index < ids.length; index += 1000) {
    const chunk = ids.slice(index, index + 1000);
    const result = await prisma.priceSnapshot.deleteMany({ where: { id: { in: chunk } } });
    deleted += result.count;
  }
  return deleted;
}
