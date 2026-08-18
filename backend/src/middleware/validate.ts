import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../lib/errors.js";

function sendValidationError(
  next: NextFunction,
  message: string,
  issues: { path: string; message: string }[],
): void {
  next(new AppError(400, "VALIDATION_ERROR", message, issues));
}

function validationDetails(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      sendValidationError(next, "Invalid request body", validationDetails(result.error));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query ?? {});

    if (!result.success) {
      sendValidationError(next, "Invalid query parameters", validationDetails(result.error));
      return;
    }

    res.locals.query = result.data;
    next();
  };
}
