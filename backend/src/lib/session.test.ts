import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session.js";

describe("session tokens", () => {
  const password = "test-admin-password";
  const secret = "test-session-secret-which-is-long-enough";

  it("creates a token that verifies", () => {
    const token = createSessionToken(60_000, password, secret);
    expect(verifySessionToken(token, password, secret)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken(60_000, password, secret);
    const [body] = token.split(".");
    expect(verifySessionToken(`${body}.aaaa`, password, secret)).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = createSessionToken(-1000, password, secret);
    expect(verifySessionToken(token, password, secret)).toBe(false);
  });

  it("rejects a token after the password changes", () => {
    const token = createSessionToken(60_000, password, secret);
    expect(verifySessionToken(token, "a-different-password", secret)).toBe(false);
  });
});
