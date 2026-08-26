import { describe, expect, it } from "vitest";
import {
  assertProductionPublicHttpsUrl,
  isLocalHostname,
  validateProductionConfig,
  validateProductionSecrets,
} from "./env.js";

describe("validateProductionSecrets", () => {
  it("allows weak values outside production", () => {
    expect(() =>
      validateProductionSecrets({
        nodeEnv: "development",
        adminPassword: "changeme",
        sessionSecret: "dev-only-session-secret",
      }),
    ).not.toThrow();
  });

  it("rejects a short production password", () => {
    expect(() =>
      validateProductionSecrets({
        nodeEnv: "production",
        adminPassword: "short-password",
        sessionSecret: "this-session-secret-is-long-enough-32",
      }),
    ).toThrow(/ADMIN_PASSWORD/);
  });

  it("rejects a common production password", () => {
    expect(() =>
      validateProductionSecrets({
        nodeEnv: "production",
        adminPassword: "changemechangeme",
        sessionSecret: "this-session-secret-is-long-enough-32",
      }),
    ).toThrow(/too common/);
  });

  it("rejects a short production session secret", () => {
    expect(() =>
      validateProductionSecrets({
        nodeEnv: "production",
        adminPassword: "a-strong-admin-pass",
        sessionSecret: "too-short",
      }),
    ).toThrow(/SESSION_SECRET/);
  });

  it("rejects known default secrets", () => {
    expect(() =>
      validateProductionSecrets({
        nodeEnv: "production",
        adminPassword: "a-strong-admin-pass",
        sessionSecret: "replace-with-a-long-random-string",
      }),
    ).toThrow(/unsafe/);
  });

  it("accepts strong production secrets", () => {
    expect(() =>
      validateProductionSecrets({
        nodeEnv: "production",
        adminPassword: "a-strong-admin-pass",
        sessionSecret: "this-session-secret-is-long-enough-32chars",
      }),
    ).not.toThrow();
  });
});

describe("validateProductionConfig", () => {
  const strong = {
    nodeEnv: "production" as const,
    adminPassword: "a-strong-admin-pass",
    sessionSecret: "this-session-secret-is-long-enough-32chars",
    siteUrl: "https://shop.example.com",
    corsOrigin: "https://shop.example.com",
    revalidateSecret: "revalidate-secret-which-is-long-enough",
    alertFromEmail: null,
    resendApiKey: null,
    trustProxy: 1,
  };

  it("skips checks outside production", () => {
    expect(
      validateProductionConfig({
        ...strong,
        nodeEnv: "development",
        siteUrl: null,
        corsOrigin: "http://localhost:3000",
        revalidateSecret: null,
      }),
    ).toEqual([]);
  });

  it("rejects missing SITE_URL", () => {
    expect(() => validateProductionConfig({ ...strong, siteUrl: null })).toThrow(/SITE_URL/);
  });

  it("rejects localhost SITE_URL", () => {
    expect(() => validateProductionConfig({ ...strong, siteUrl: "https://localhost:3000" })).toThrow(/localhost/);
  });

  it("rejects http SITE_URL", () => {
    expect(() => validateProductionConfig({ ...strong, siteUrl: "http://shop.example.com" })).toThrow(/https/);
  });

  it("rejects localhost CORS_ORIGIN", () => {
    expect(() => validateProductionConfig({ ...strong, corsOrigin: "http://localhost:3000" })).toThrow(/CORS_ORIGIN/);
  });

  it("rejects a short REVALIDATE_SECRET", () => {
    expect(() => validateProductionConfig({ ...strong, revalidateSecret: "short" })).toThrow(/REVALIDATE_SECRET/);
  });

  it("rejects a missing REVALIDATE_SECRET", () => {
    expect(() => validateProductionConfig({ ...strong, revalidateSecret: null })).toThrow(/REVALIDATE_SECRET/);
  });

  it("rejects only one of the alert mail vars", () => {
    expect(() => validateProductionConfig({ ...strong, alertFromEmail: "alerts@example.com" })).toThrow(
      /ALERT_FROM_EMAIL/,
    );
  });

  it("warns when alert mail is disabled and when TRUST_PROXY is 0", () => {
    const warnings = validateProductionConfig({ ...strong, trustProxy: 0 });
    expect(warnings.some((line) => line.includes("Price-alert email is disabled"))).toBe(true);
    expect(warnings.some((line) => line.includes("TRUST_PROXY"))).toBe(true);
  });

  it("accepts a complete production config with no warnings", () => {
    expect(
      validateProductionConfig({
        ...strong,
        alertFromEmail: "alerts@example.com",
        resendApiKey: "re_placeholder",
      }),
    ).toEqual([]);
  });
});

describe("assertProductionPublicHttpsUrl", () => {
  it("detects local hostnames", () => {
    expect(isLocalHostname("localhost")).toBe(true);
    expect(isLocalHostname("127.0.0.1")).toBe(true);
    expect(isLocalHostname("shop.example.com")).toBe(false);
  });

  it("requires https public hosts", () => {
    expect(() => assertProductionPublicHttpsUrl("SITE_URL", "https://shop.example.com")).not.toThrow();
    expect(() => assertProductionPublicHttpsUrl("SITE_URL", "not-a-url")).toThrow(/valid URL/);
  });
});
