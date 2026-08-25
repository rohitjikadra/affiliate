import { prisma } from "../../config/prisma.js";
import type { Job, JobType, Prisma } from "../../generated/prisma/client.js";

export async function enqueueJob(
  type: JobType,
  payload: Prisma.InputJsonValue,
  options: { runAfter?: Date; priority?: number; maxAttempts?: number } = {},
) {
  return prisma.job.create({
    data: {
      type,
      payload,
      runAfter: options.runAfter ?? new Date(),
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 5,
    },
  });
}

export async function claimNextJob(workerId: string): Promise<Job | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE jobs
    SET status = 'RUNNING'::"JobStatus",
        locked_at = NOW(),
        locked_by = ${workerId},
        attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'PENDING'::"JobStatus" AND run_after <= NOW()
      ORDER BY priority DESC, run_after ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id
  `;
  if (!rows[0]) {
    return null;
  }
  return prisma.job.findUnique({ where: { id: rows[0].id } });
}

export async function completeJob(id: string): Promise<void> {
  await prisma.job.update({
    where: { id },
    data: { status: "SUCCEEDED", completedAt: new Date(), lastError: null, lockedAt: null, lockedBy: null },
  });
}

export async function failJob(job: Job, error: string): Promise<void> {
  const dead = job.attempts >= job.maxAttempts;
  await prisma.job.update({
    where: { id: job.id },
    data: {
      status: dead ? "DEAD" : "PENDING",
      lastError: error.slice(0, 2000),
      lockedAt: null,
      lockedBy: null,
      runAfter: dead
        ? job.runAfter
        : new Date(Date.now() + Math.min(24 * 60 * 60 * 1000, 5 * 60 * 1000 * 2 ** Math.max(0, job.attempts - 1))),
      completedAt: dead ? new Date() : null,
    },
  });
}

export async function retryJob(id: string): Promise<void> {
  await prisma.job.update({
    where: { id },
    data: { status: "PENDING", runAfter: new Date(), lockedAt: null, lockedBy: null, lastError: null },
  });
}

export async function listJobs(status?: Job["status"]) {
  return prisma.job.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function reclaimStaleJobs(staleAfterMs = 5 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - staleAfterMs);
  const result = await prisma.job.updateMany({
    where: { status: "RUNNING", lockedAt: { lt: cutoff } },
    data: { status: "PENDING", lockedAt: null, lockedBy: null, lastError: "Lock expired" },
  });
  return result.count;
}

export async function enqueueDueOfferRefreshes(limit = 50): Promise<number> {
  const due = await prisma.offer.findMany({
    where: {
      nextFetchAt: { lte: new Date() },
      fetchStatus: { notIn: ["INVALID", "QUEUED"] },
      merchant: { isActive: true, fetchEnabled: true },
      product: { isActive: true, status: "PUBLISHED" },
    },
    select: { id: true },
    take: limit,
    orderBy: { nextFetchAt: "asc" },
  });
  for (const offer of due) {
    await prisma.offer.update({ where: { id: offer.id }, data: { fetchStatus: "QUEUED" } });
    await enqueueJob("PRICE_REFRESH", { offerId: offer.id }, { priority: 10 });
  }
  return due.length;
}

export async function touchHeartbeat(workerId: string, stats: Prisma.InputJsonValue): Promise<void> {
  await prisma.workerHeartbeat.upsert({
    where: { id: workerId },
    create: { id: workerId, stats },
    update: { stats },
  });
}

export async function enqueueSnapshotCompactIfDue(intervalMs = 24 * 60 * 60 * 1000): Promise<boolean> {
  const open = await prisma.job.findFirst({
    where: { type: "SNAPSHOT_COMPACT", status: { in: ["PENDING", "RUNNING"] } },
    select: { id: true },
  });
  if (open) {
    return false;
  }
  const recent = await prisma.job.findFirst({
    where: {
      type: "SNAPSHOT_COMPACT",
      status: "SUCCEEDED",
      completedAt: { gte: new Date(Date.now() - intervalMs) },
    },
    select: { id: true },
  });
  if (recent) {
    return false;
  }
  await enqueueJob("SNAPSHOT_COMPACT", {}, { priority: -10 });
  return true;
}

export async function getWorkerHealth(maxAgeMs = 2 * 60 * 1000) {
  const heartbeat = await prisma.workerHeartbeat.findFirst({ orderBy: { lastSeenAt: "desc" } });
  if (!heartbeat) {
    return { status: "down" as const, lastSeenAt: null };
  }
  const stale = Date.now() - heartbeat.lastSeenAt.getTime() > maxAgeMs;
  return { status: stale ? ("down" as const) : ("up" as const), lastSeenAt: heartbeat.lastSeenAt.toISOString() };
}
