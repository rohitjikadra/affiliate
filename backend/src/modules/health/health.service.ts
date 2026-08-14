import { prisma } from "../../config/prisma.js";
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
  const database = await checkDatabase();

  return {
    status: database === "up" ? "ok" : "degraded",
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    checks: {
      database: { status: database },
    },
  };
}
