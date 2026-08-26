import "dotenv/config";

export type NodeEnv = "development" | "test" | "production";

const UNSAFE_PASSWORDS = new Set([
  "changeme",
  "changemechangeme",
  "password",
  "admin",
  "admin123",
  "secret",
  "12345678",
  "password123",
]);

const UNSAFE_SECRETS = new Set([
  "dev-only-session-secret",
  "replace-with-a-long-random-string",
  "secret",
  "changeme",
]);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function readString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function readPort(name: string, fallback: number): number {
  const raw = process.env[name];
  const port = raw ? Number(raw) : fallback;

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer`);
  }

  return port;
}

export function readNodeEnv(value = process.env.NODE_ENV ?? "development"): NodeEnv {
  if (value !== "development" && value !== "test" && value !== "production") {
    throw new Error(`Invalid NODE_ENV: ${value}`);
  }

  return value;
}

export function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return LOCAL_HOSTS.has(host) || host.endsWith(".localhost");
}

export function assertProductionPublicHttpsUrl(name: string, value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL in production`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${name} must use https in production`);
  }

  if (isLocalHostname(parsed.hostname)) {
    throw new Error(`${name} must not be a localhost URL in production`);
  }
}

export function validateProductionSecrets(input: {
  nodeEnv: NodeEnv;
  adminPassword: string;
  sessionSecret: string;
}): void {
  if (input.nodeEnv !== "production") {
    return;
  }

  if (input.adminPassword.length < 16) {
    throw new Error("ADMIN_PASSWORD must be at least 16 characters in production");
  }

  if (UNSAFE_PASSWORDS.has(input.adminPassword.toLowerCase())) {
    throw new Error("ADMIN_PASSWORD is too common to use in production");
  }

  if (input.sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }

  if (UNSAFE_SECRETS.has(input.sessionSecret.toLowerCase())) {
    throw new Error("SESSION_SECRET is unsafe to use in production");
  }
}

export function validateProductionConfig(input: {
  nodeEnv: NodeEnv;
  adminPassword: string;
  sessionSecret: string;
  siteUrl: string | null;
  corsOrigin: string;
  revalidateSecret: string | null;
  alertFromEmail: string | null;
  resendApiKey: string | null;
  trustProxy: number;
}): string[] {
  if (input.nodeEnv !== "production") {
    return [];
  }

  validateProductionSecrets(input);

  if (!input.siteUrl) {
    throw new Error("SITE_URL is required in production");
  }
  assertProductionPublicHttpsUrl("SITE_URL", input.siteUrl);
  assertProductionPublicHttpsUrl("CORS_ORIGIN", input.corsOrigin);

  if (!input.revalidateSecret) {
    throw new Error("REVALIDATE_SECRET is required in production");
  }
  if (input.revalidateSecret.length < 32) {
    throw new Error("REVALIDATE_SECRET must be at least 32 characters in production");
  }
  if (UNSAFE_SECRETS.has(input.revalidateSecret.toLowerCase())) {
    throw new Error("REVALIDATE_SECRET is unsafe to use in production");
  }

  const hasFrom = Boolean(input.alertFromEmail);
  const hasKey = Boolean(input.resendApiKey);
  if (hasFrom !== hasKey) {
    throw new Error(
      "ALERT_FROM_EMAIL and RESEND_API_KEY must both be set to send price-alert email, or both left empty to disable sending",
    );
  }

  const warnings: string[] = [];
  if (!hasFrom && !hasKey) {
    warnings.push(
      "Price-alert email is disabled because ALERT_FROM_EMAIL and RESEND_API_KEY are unset. Alerts can still be created but no mail will be sent.",
    );
  }
  if (input.trustProxy === 0) {
    warnings.push(
      "TRUST_PROXY is 0. Behind nginx or Caddy set TRUST_PROXY=1 so rate limits use the real client IP. Only trust hops your proxy overwrites.",
    );
  }
  return warnings;
}

function readTrustProxy(): number {
  const raw = process.env.TRUST_PROXY;
  if (!raw) {
    return 0;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Invalid TRUST_PROXY: expected a non-negative integer");
  }

  return value;
}

function emitProductionWarnings(warnings: string[]): void {
  for (const warning of warnings) {
    console.warn(JSON.stringify({ level: "warn", message: "production_config", extra: { warning } }));
  }
}

const nodeEnv = readNodeEnv();

const adminPassword = readString("ADMIN_PASSWORD", nodeEnv === "production" ? undefined : "changeme");
const sessionSecret = readString(
  "SESSION_SECRET",
  nodeEnv === "production" ? undefined : "dev-only-session-secret",
);

const corsOrigin = readString("CORS_ORIGIN", nodeEnv === "production" ? undefined : "http://localhost:3000");
const siteUrl = (process.env.SITE_URL ?? "").trim() || null;
const revalidateSecret = (process.env.REVALIDATE_SECRET ?? "").trim() || null;
const alertFromEmail = (process.env.ALERT_FROM_EMAIL ?? "").trim() || null;
const resendApiKey = (process.env.RESEND_API_KEY ?? "").trim() || null;
const trustProxy = readTrustProxy();

const productionWarnings = validateProductionConfig({
  nodeEnv,
  adminPassword,
  sessionSecret,
  siteUrl,
  corsOrigin,
  revalidateSecret,
  alertFromEmail,
  resendApiKey,
  trustProxy,
});
emitProductionWarnings(productionWarnings);

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: readPort("PORT", 4000),
  databaseUrl: readString("DATABASE_URL"),
  corsOrigin,
  adminPassword,
  sessionSecret,
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  amazonAssociateTag: (process.env.AMAZON_ASSOCIATE_TAG ?? "").trim() || null,
  // Creators API replaces PA-API 5. Empty credentials = tagged /go links only; never scrape.
  amazonCreatorsCredentialId: (process.env.AMAZON_CREATORS_CREDENTIAL_ID ?? "").trim() || null,
  amazonCreatorsCredentialSecret: (process.env.AMAZON_CREATORS_CREDENTIAL_SECRET ?? "").trim() || null,
  amazonCreatorsMarketplace: (process.env.AMAZON_CREATORS_MARKETPLACE ?? "www.amazon.in").trim(),
  priceHistoryPublic: (process.env.PRICE_HISTORY_PUBLIC ?? "false").toLowerCase() === "true",
  alertFromEmail,
  resendApiKey,
  revalidateSecret,
  trustProxy,
  siteUrl,
} as const;
