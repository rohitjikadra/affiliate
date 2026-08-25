import { describe, expect, it } from "vitest";
import { hostMatchesAllowlist, isAllowedMerchantUrl, isPrivateHostname, isSafeHttpUrl } from "./url.js";

describe("url safety", () => {
  it("accepts http and https", () => {
    expect(isSafeHttpUrl("https://www.amazon.in/dp/B00TEST")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("blocks private hosts", () => {
    expect(isPrivateHostname("localhost")).toBe(true);
    expect(isPrivateHostname("127.0.0.1")).toBe(true);
    expect(isPrivateHostname("10.0.0.8")).toBe(true);
    expect(isPrivateHostname("192.168.1.9")).toBe(true);
    expect(isPrivateHostname("www.amazon.in")).toBe(false);
  });

  it("matches merchant allowlists including subdomains", () => {
    expect(hostMatchesAllowlist("www.amazon.in", ["amazon.in"])).toBe(true);
    expect(hostMatchesAllowlist("evil.example", ["amazon.in"])).toBe(false);
  });

  it("rejects SSRF-style merchant URLs even on https", () => {
    expect(isAllowedMerchantUrl("https://127.0.0.1/latest", ["amazon.in"])).toBe(false);
    expect(isAllowedMerchantUrl("https://www.amazon.in/dp/B00", ["amazon.in"])).toBe(true);
  });

  it("rejects merchant URLs when the allowlist is empty", () => {
    expect(isAllowedMerchantUrl("https://www.amazon.in/dp/B00", [])).toBe(false);
    expect(isAllowedMerchantUrl("https://127.0.0.1/latest", [])).toBe(false);
  });
});
