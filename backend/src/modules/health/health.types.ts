export type HealthStatus = "ok" | "degraded";
export type CheckStatus = "up" | "down";

export interface HealthCheckResult {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: {
      status: CheckStatus;
    };
  };
}
