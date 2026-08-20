import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { clientIp, hashIp } from "../../lib/ip.js";
import { clearSessionCookie, passwordsMatch, setSessionCookie } from "../../lib/session.js";
import type { LoginInput } from "./auth.schemas.js";

export async function login(req: Request, res: Response): Promise<void> {
  const { password } = req.body as LoginInput;

  if (!passwordsMatch(password, env.adminPassword)) {
    logger.warn("login_failed", { ipHash: hashIp(clientIp(req)) });
    throw new AppError(401, "UNAUTHORIZED", "Invalid password");
  }

  setSessionCookie(res);
  res.status(200).json({ data: { ok: true } });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.status(200).json({ data: { ok: true } });
}

export async function me(_req: Request, res: Response): Promise<void> {
  if (!res.locals.isAdmin) {
    throw new AppError(401, "UNAUTHORIZED", "Admin login required");
  }

  res.status(200).json({ data: { ok: true } });
}
