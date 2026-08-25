import { randomUUID } from "node:crypto";
import { env } from "./config/env.js";
import { disconnectPrisma } from "./config/prisma.js";
import { logger } from "./lib/logger.js";
import { claimNextJob, completeJob, enqueueDueOfferRefreshes, enqueueSnapshotCompactIfDue, failJob, reclaimStaleJobs, touchHeartbeat } from "./modules/jobs/queue.js";
import { refreshOffer, revalidatePath } from "./modules/jobs/refresh.js";
import { compactOldSnapshots } from "./modules/pricing/snapshot.js";
import { dispatchAlertsForOffer } from "./modules/alerts/alert.service.js";
import { importProducts, parseProductImportPayload } from "./modules/imports/import.service.js";

const workerId = `worker-${process.pid}-${randomUUID().slice(0, 8)}`;

async function handleJob(type: string, payload: unknown): Promise<void> {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  if (type === "PRICE_REFRESH" && typeof data.offerId === "string") {
    await refreshOffer(data.offerId);
    return;
  }
  if (type === "ALERT_DISPATCH" && typeof data.offerId === "string") {
    await dispatchAlertsForOffer(data.offerId);
    return;
  }
  if (type === "SNAPSHOT_COMPACT") {
    await compactOldSnapshots();
    return;
  }
  if (type === "REVALIDATE") {
    const fromPath = typeof data.path === "string" ? [data.path] : [];
    const fromPaths = Array.isArray(data.paths)
      ? data.paths.filter((value): value is string => typeof value === "string")
      : [];
    const paths = [...new Set([...fromPath, ...fromPaths])];
    if (paths.length > 0) {
      await revalidatePath(paths);
    }
    return;
  }
  if (type === "PRODUCT_IMPORT") {
    await importProducts(parseProductImportPayload(data));
    return;
  }
  throw new Error(`Unknown job type ${type}`);
}

async function tick(): Promise<void> {
  await reclaimStaleJobs();
  await enqueueDueOfferRefreshes();
  await enqueueSnapshotCompactIfDue();
  const job = await claimNextJob(workerId);
  if (!job) {
    await touchHeartbeat(workerId, { idle: true });
    return;
  }
  try {
    await handleJob(job.type, job.payload);
    await completeJob(job.id);
    await touchHeartbeat(workerId, { lastJob: job.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    await failJob(job, message);
    logger.error("job_failed", { id: job.id, type: job.type, message });
  }
}

async function main(): Promise<void> {
  logger.info("worker_started", { workerId, env: env.nodeEnv });
  await touchHeartbeat(workerId, { started: true });
  const timer = setInterval(() => {
    void tick();
  }, 30_000);
  void tick();

  const shutdown = async (signal: string) => {
    logger.info("worker_stopping", { signal });
    clearInterval(timer);
    await disconnectPrisma();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void main();
