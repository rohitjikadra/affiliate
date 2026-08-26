import { describe, expect, it } from "vitest";
import { assertNotProductionSeed } from "./production-guard.js";

describe("assertNotProductionSeed", () => {
  it("allows development, test, and unset NODE_ENV", () => {
    expect(() => assertNotProductionSeed("development")).not.toThrow();
    expect(() => assertNotProductionSeed("test")).not.toThrow();
    expect(() => assertNotProductionSeed(undefined)).not.toThrow();
  });

  it("refuses to run in production", () => {
    expect(() => assertNotProductionSeed("production")).toThrow(/NODE_ENV=production/);
    expect(() => assertNotProductionSeed("production")).toThrow(/deletes all catalog data/);
  });
});
