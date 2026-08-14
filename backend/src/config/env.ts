import "dotenv/config";

type NodeEnv = "development" | "test" | "production";

function readString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readPort(name: string, fallback: number): number {
  const raw = process.env[name];
  const port = raw ? Number(raw) : fallback;

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer`);
  }

  return port;
}

function readNodeEnv(): NodeEnv {
  const value = process.env.NODE_ENV ?? "development";

  if (value !== "development" && value !== "test" && value !== "production") {
    throw new Error(`Invalid NODE_ENV: ${value}`);
  }

  return value;
}

const nodeEnv = readNodeEnv();

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: readPort("PORT", 4000),
  databaseUrl: readString("DATABASE_URL"),
  corsOrigin: readString("CORS_ORIGIN", "http://localhost:3000"),
} as const;
