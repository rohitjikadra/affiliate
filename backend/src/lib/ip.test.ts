import { describe, expect, it } from "vitest";
import { classifyDevice, hashIp } from "./ip.js";

describe("ip helpers", () => {
  it("hashes an IP without returning the raw value", () => {
    const hashed = hashIp("203.0.113.10", "unit-test-session-secret-32chars!!");
    expect(hashed).toHaveLength(32);
    expect(hashed).not.toContain("203.0.113");
  });

  it("classifies common user agents", () => {
    expect(classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(classifyDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
    expect(classifyDevice("Googlebot/2.1")).toBe("bot");
  });
});
