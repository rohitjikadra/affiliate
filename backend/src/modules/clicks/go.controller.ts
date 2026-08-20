import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import { classifyDevice, clientIp, hashIp } from "../../lib/ip.js";
import { recordOfferClick } from "../clicks/click.service.js";

export async function goOffer(req: Request, res: Response): Promise<void> {
  const offerId = req.params.offerId;
  if (typeof offerId !== "string" || !offerId) {
    throw new AppError(400, "VALIDATION_ERROR", "Offer is required");
  }

  const result = await recordOfferClick(offerId, {
    referrer: req.get("referer") ?? undefined,
    userAgent: req.get("user-agent") ?? undefined,
    landingPath: typeof req.query.landing === "string" ? req.query.landing : undefined,
    utmSource: typeof req.query.utm_source === "string" ? req.query.utm_source : undefined,
    utmMedium: typeof req.query.utm_medium === "string" ? req.query.utm_medium : undefined,
    utmCampaign: typeof req.query.utm_campaign === "string" ? req.query.utm_campaign : undefined,
    ipHash: hashIp(clientIp(req)),
    device: classifyDevice(req.get("user-agent") ?? undefined),
  });

  res.redirect(302, result.url);
}
