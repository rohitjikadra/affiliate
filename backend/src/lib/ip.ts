import { createHmac } from "node:crypto";
import type { Request } from "express";
import { env } from "../config/env.js";

export function clientIp(req: Request): string | undefined {
  const forwarded = req.ip?.trim();
  return forwarded || undefined;
}

export function hashIp(ip: string | undefined, secret: string = env.sessionSecret): string | undefined {
  if (!ip) {
    return undefined;
  }

  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret).update(`${day}:${ip}`).digest("hex").slice(0, 32);
}

export function classifyDevice(userAgent: string | undefined): string | undefined {
  if (!userAgent) {
    return undefined;
  }

  const ua = userAgent.toLowerCase();
  if (/bot|spider|crawler|preview|facebookexternalhit|slurp/.test(ua)) {
    return "bot";
  }
  if (/ipad|tablet/.test(ua)) {
    return "tablet";
  }
  if (/mobi|iphone|android/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}
