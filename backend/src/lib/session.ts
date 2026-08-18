import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "ah_session";

type SessionPayload = {
  exp: number;
};

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: env.sessionTtlMs,
  };
}

export function passwordsMatch(input: string, expected: string): boolean {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function createSessionToken(): string {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + env.sessionTtlMs } satisfies SessionPayload)).toString(
    "base64url",
  );
  const signature = createHmac("sha256", env.sessionSecret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) {
    return false;
  }

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = createHmac("sha256", env.sessionSecret).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.get("cookie");
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const equals = trimmed.indexOf("=");
    if (equals === -1) {
      continue;
    }

    if (trimmed.slice(0, equals) === name) {
      return decodeURIComponent(trimmed.slice(equals + 1));
    }
  }

  return undefined;
}

export function setSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE, createSessionToken(), cookieOptions());
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  });
}

export function hasValidSession(req: Request): boolean {
  const token = readCookie(req, SESSION_COOKIE);
  return Boolean(token && verifySessionToken(token));
}
