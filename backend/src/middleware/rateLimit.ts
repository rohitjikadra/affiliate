import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

function jsonHandler(message: string) {
  return (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message,
      },
    });
  };
}

const skipInTest = () => env.isTest;

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: jsonHandler("Too many login attempts. Try again later."),
});

export const goRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: jsonHandler("Too many checkout requests. Try again shortly."),
});

export const pageViewRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: jsonHandler("Too many requests. Try again shortly."),
});

export const alertRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  handler: jsonHandler("Too many alert requests. Try again later."),
});
