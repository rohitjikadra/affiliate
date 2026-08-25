import { prisma } from "../../config/prisma.js";
import { getWorkerHealth } from "../jobs/queue.js";
import type { CheckStatus, HealthCheckResult } from "./health.types.js";

const SERVICE_NAME = "affiliate-api";

async function checkDatabase(): Promise<CheckStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "up";
  } catch {
    return "down";
  }
}

export async function getHealth(): Promise<HealthCheckResult> {
  const [database, worker] = await Promise.all([checkDatabase(), getWorkerHealth()]);

  return {
    status: database === "up" ? "ok" : "degraded",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      database: { status: database },
      worker: { status: worker.status === "up" ? "up" : "down", lastSeenAt: worker.lastSeenAt },
    },
  };
}
