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

const nodeEnv = readNodeEnv();

const adminPassword = readString("ADMIN_PASSWORD", nodeEnv === "production" ? undefined : "changeme");
const sessionSecret = readString(
  "SESSION_SECRET",
  nodeEnv === "production" ? undefined : "dev-only-session-secret",
);

validateProductionSecrets({ nodeEnv, adminPassword, sessionSecret });

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: readPort("PORT", 4000),
  databaseUrl: readString("DATABASE_URL"),
  corsOrigin: readString("CORS_ORIGIN", "http://localhost:3000"),
  adminPassword,
  sessionSecret,
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  amazonAssociateTag: (process.env.AMAZON_ASSOCIATE_TAG ?? "").trim() || null,
  trustProxy: readTrustProxy(),
  siteUrl: (process.env.SITE_URL ?? "").trim() || null,
} as const;
