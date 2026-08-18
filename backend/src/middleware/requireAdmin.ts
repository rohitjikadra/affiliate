import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { hasValidSession } from "../lib/session.js";

export function attachAdmin(req: Request, res: Response, next: NextFunction): void {
  res.locals.isAdmin = hasValidSession(req);
  next();
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  if (!res.locals.isAdmin) {
    next(new AppError(401, "UNAUTHORIZED", "Admin login required"));
    return;
  }

  next();
}
