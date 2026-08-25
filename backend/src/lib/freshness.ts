const FRESH_MS = 2 * 60 * 60 * 1000;
const AGING_MS = 24 * 60 * 60 * 1000;

export type FreshnessLevel = "fresh" | "aging" | "stale" | "unknown";

export function freshnessLevel(checkedAt: Date | string | null | undefined, now = Date.now()): FreshnessLevel {
  if (!checkedAt) {
    return "unknown";
  }
  const timestamp = typeof checkedAt === "string" ? Date.parse(checkedAt) : checkedAt.getTime();
  if (!Number.isFinite(timestamp)) {
    return "unknown";
  }
  const age = now - timestamp;
  if (age <= FRESH_MS) {
    return "fresh";
  }
  if (age <= AGING_MS) {
    return "aging";
  }
  return "stale";
}

export function isFreshEnough(checkedAt: Date | string | null | undefined, maxAgeMs = AGING_MS, now = Date.now()): boolean {
  if (!checkedAt) {
    return false;
  }
  const timestamp = typeof checkedAt === "string" ? Date.parse(checkedAt) : checkedAt.getTime();
  return Number.isFinite(timestamp) && now - timestamp <= maxAgeMs;
}

export function freshnessLabel(checkedAt: Date | string | null | undefined, now = Date.now()): string {
  if (!checkedAt) {
    return "Price not checked yet";
  }
  const timestamp = typeof checkedAt === "string" ? Date.parse(checkedAt) : checkedAt.getTime();
  if (!Number.isFinite(timestamp)) {
    return "Price not checked yet";
  }
  const ageMs = Math.max(0, now - timestamp);
  const minutes = Math.round(ageMs / 60_000);
  if (minutes < 1) {
    return "Checked just now";
  }
  if (minutes < 60) {
    return `Checked ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Checked ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.round(hours / 24);
  if (days === 1) {
    return "Checked yesterday";
  }
  return `Checked ${days} days ago`;
}
