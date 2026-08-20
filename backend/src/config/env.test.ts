import { describe, expect, it } from "vitest";
import { validateProductionSecrets } from "./env.js";

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
