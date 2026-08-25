import { z } from "zod";
import { Router } from "express";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { alertRateLimit } from "../../middleware/rateLimit.js";
import { createPriceAlert, unsubscribeAlert, verifyAlert } from "./alert.service.js";

export const createAlertSchema = z
  .object({
    productId: z.string().min(1),
    email: z.string().trim().email().max(200),
    type: z.enum(["TARGET_PRICE", "PERCENT_DROP", "NEW_LOW"]).default("TARGET_PRICE"),
    targetPrice: z.number().positive().optional(),
    percentThreshold: z.number().min(1).max(90).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "TARGET_PRICE" && value.targetPrice == null) {
      ctx.addIssue({ code: "custom", path: ["targetPrice"], message: "Enter a target price" });
    }
    if (value.type === "PERCENT_DROP" && value.percentThreshold == null) {
      ctx.addIssue({ code: "custom", path: ["percentThreshold"], message: "Enter a percent drop" });
    }
  });

const tokenQuery = z.object({ token: z.string().min(10).max(200) });

export const alertRouter = Router();

alertRouter.post("/", alertRateLimit, validateBody(createAlertSchema), async (req, res) => {
  const data = await createPriceAlert(req.body);
  res.status(201).json({ data });
});

alertRouter.get("/verify", validateQuery(tokenQuery), async (_req, res) => {
  const data = await verifyAlert((res.locals.query as { token: string }).token);
  res.status(200).json({ data });
});

alertRouter.get("/unsubscribe", validateQuery(tokenQuery), async (_req, res) => {
  const data = await unsubscribeAlert((res.locals.query as { token: string }).token);
  res.status(200).json({ data });
});
