import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { enqueueJob, listJobs, retryJob, getWorkerHealth } from "../jobs/queue.js";
import { compactOldSnapshots } from "../pricing/snapshot.js";

function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

export async function getOpsOverview() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [pendingJobs, deadJobs, staleOffers, failedOffers, queuedOffers, activeAlerts, snapshotCount, priceEventsLast24h, worker] =
    await Promise.all([
      prisma.job.count({ where: { status: "PENDING" } }),
      prisma.job.count({ where: { status: "DEAD" } }),
      prisma.offer.count({
        where: {
          OR: [{ lastSuccessfulFetchAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } }, { lastSuccessfulFetchAt: null }],
          merchant: { fetchEnabled: true },
        },
      }),
      prisma.offer.count({ where: { fetchStatus: { in: ["ERROR", "RATE_LIMITED", "INVALID"] } } }),
      prisma.offer.count({ where: { fetchStatus: "QUEUED" } }),
      prisma.priceAlert.count({ where: { isActive: true, emailVerifiedAt: { not: null } } }),
      prisma.priceSnapshot.count(),
      prisma.priceEvent.count({ where: { createdAt: { gte: since } } }),
      getWorkerHealth(),
    ]);
  return {
    pendingJobs,
    deadJobs,
    staleOffers,
    failedOffers,
    queuedOffers,
    activeAlerts,
    snapshotCount,
    priceEventsLast24h,
    retainDays: 90,
    worker,
  };
}

function serializeOpsOffer(offer: {
  id: string;
  price: { toString(): string } | null;
  currency: string;
  fetchStatus: string;
  fetchError: string | null;
  consecutiveFailures: number;
  lastSuccessfulFetchAt: Date | null;
  nextFetchAt: Date | null;
  product: { id: string; slug: string; title: string };
  merchant: { name: string; slug: string };
}) {
  return {
    id: offer.id,
    price: offer.price != null ? offer.price.toString() : null,
    currency: offer.currency,
    fetchStatus: offer.fetchStatus,
    fetchError: offer.fetchError,
    consecutiveFailures: offer.consecutiveFailures,
    lastSuccessfulFetchAt: iso(offer.lastSuccessfulFetchAt),
    nextFetchAt: iso(offer.nextFetchAt),
    product: offer.product,
    merchant: offer.merchant,
  };
}

export async function listStaleOrFailedOffers(freshness: "stale" | "failed" | "queued") {
  const include = {
    product: { select: { id: true, slug: true, title: true } },
    merchant: { select: { name: true, slug: true } },
  } as const;

  if (freshness === "failed") {
    const rows = await prisma.offer.findMany({
      where: { fetchStatus: { in: ["ERROR", "RATE_LIMITED", "INVALID"] } },
      include,
      orderBy: { consecutiveFailures: "desc" },
      take: 100,
    });
    return rows.map(serializeOpsOffer);
  }
  if (freshness === "queued") {
    const rows = await prisma.offer.findMany({
      where: { fetchStatus: "QUEUED" },
      include,
      take: 100,
    });
    return rows.map(serializeOpsOffer);
  }
  const rows = await prisma.offer.findMany({
    where: {
      OR: [{ lastSuccessfulFetchAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } }, { lastSuccessfulFetchAt: null }],
    },
    include,
    orderBy: { lastSuccessfulFetchAt: "asc" },
    take: 100,
  });
  return rows.map(serializeOpsOffer);
}

export async function refreshOfferNow(offerId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId }, select: { id: true } });
  if (!offer) {
    throw new AppError(404, "NOT_FOUND", "Offer not found");
  }
  await prisma.offer.update({
    where: { id: offerId },
    data: { fetchStatus: "QUEUED", nextFetchAt: new Date(), consecutiveFailures: 0, fetchError: null },
  });
  return enqueueJob("PRICE_REFRESH", { offerId }, { priority: 100 });
}

export async function listOpsJobs() {
  const jobs = await listJobs();
  return jobs.map((job) => ({
    id: job.id,
    type: job.type,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    lastError: job.lastError,
    runAfter: iso(job.runAfter),
    createdAt: iso(job.createdAt),
    completedAt: iso(job.completedAt),
  }));
}

export async function retryJobById(id: string) {
  const job = await prisma.job.findUnique({ where: { id }, select: { id: true } });
  if (!job) {
    throw new AppError(404, "NOT_FOUND", "Job not found");
  }
  await retryJob(id);
  return { id, retried: true };
}

export async function compactSnapshotsNow() {
  const deleted = await compactOldSnapshots();
  return { deleted, retainDays: 90 };
}
