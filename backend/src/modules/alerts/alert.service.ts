import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { createToken, hashToken, normalizeEmail } from "../../lib/tokens.js";
import { sendEmail } from "../../lib/mailer.js";
import { enqueueJob } from "../jobs/queue.js";
import type { AlertType, PriceEventType } from "../../generated/prisma/client.js";

function siteLink(path: string): string {
  return `${(env.siteUrl ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

const PRIVACY =
  "We store your email only to send this product's price alerts. You can unsubscribe any time. We do not sell your email.";

function assertAlertFields(input: { type: AlertType; targetPrice?: number | null; percentThreshold?: number | null }) {
  if (input.type === "TARGET_PRICE" && (input.targetPrice == null || !Number.isFinite(input.targetPrice) || input.targetPrice <= 0)) {
    throw new AppError(400, "VALIDATION_ERROR", "Enter a target price");
  }
  if (
    input.type === "PERCENT_DROP" &&
    (input.percentThreshold == null || !Number.isFinite(input.percentThreshold) || input.percentThreshold < 1)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Enter a percent drop");
  }
}

export function alertMatches(
  alert: { type: AlertType; targetPrice: unknown; percentThreshold: unknown },
  events: { type: PriceEventType; percent: unknown }[],
  currentPrice: number | null,
) {
  const types = events.map((event) => event.type);
  if (alert.type === "NEW_LOW") {
    return types.includes("NEW_LOW");
  }
  if (alert.type === "PERCENT_DROP") {
    const threshold = alert.percentThreshold != null ? Number(alert.percentThreshold) : 10;
    return events.some(
      (event) => event.type === "DROP" && event.percent != null && Math.abs(Number(event.percent)) >= threshold,
    );
  }
  if (alert.type === "TARGET_PRICE" && alert.targetPrice != null && currentPrice != null) {
    return currentPrice <= Number(alert.targetPrice);
  }
  return false;
}

export async function createPriceAlert(input: {
  productId: string;
  email: string;
  type: AlertType;
  targetPrice?: number | null;
  percentThreshold?: number | null;
}) {
  assertAlertFields(input);

  const product = await prisma.product.findFirst({
    where: { id: input.productId, isActive: true, status: "PUBLISHED" },
    select: { id: true, title: true, slug: true },
  });
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  const email = normalizeEmail(input.email);
  const verifyToken = createToken();
  const unsubToken = createToken();

  const existing = await prisma.priceAlert.findFirst({
    where: { emailNormalized: email, productId: product.id, type: input.type },
    orderBy: { createdAt: "desc" },
  });
  const keepVerified = existing?.emailVerifiedAt != null;
  const alert = existing
    ? await prisma.priceAlert.update({
        where: { id: existing.id },
        data: {
          email: input.email.trim(),
          targetPrice: input.targetPrice ?? existing.targetPrice,
          percentThreshold: input.percentThreshold ?? existing.percentThreshold,
          isActive: true,
          unsubTokenHash: hashToken(unsubToken),
          ...(keepVerified
            ? {}
            : { verifyTokenHash: hashToken(verifyToken), emailVerifiedAt: null }),
        },
      })
    : await prisma.priceAlert.create({
        data: {
          productId: product.id,
          email: input.email.trim(),
          emailNormalized: email,
          type: input.type,
          targetPrice: input.targetPrice ?? null,
          percentThreshold: input.percentThreshold ?? null,
          verifyTokenHash: hashToken(verifyToken),
          unsubTokenHash: hashToken(unsubToken),
        },
      });

  const emailSent = await sendEmail({
    to: email,
    subject: keepVerified
      ? `Your price alert was updated for ${product.title}`
      : `Confirm your price alert for ${product.title}`,
    text: keepVerified
      ? `Your price alert for ${product.title} is active.\nSee it: ${siteLink(`/products/${product.slug}`)}\n\nUnsubscribe: ${siteLink(`/alerts/unsubscribe?token=${unsubToken}`)}\n\n${PRIVACY}`
      : `Confirm this alert: ${siteLink(`/alerts/verify?token=${verifyToken}`)}\n\nUnsubscribe: ${siteLink(`/alerts/unsubscribe?token=${unsubToken}`)}\n\n${PRIVACY}`,
  });

  return { id: alert.id, email, productId: product.id, emailSent };
}

export async function verifyAlert(token: string) {
  const alert = await prisma.priceAlert.findFirst({ where: { verifyTokenHash: hashToken(token), isActive: true } });
  if (!alert) {
    throw new AppError(404, "NOT_FOUND", "Alert not found");
  }
  await prisma.priceAlert.update({
    where: { id: alert.id },
    data: { emailVerifiedAt: new Date(), verifyTokenHash: null },
  });
  return { ok: true };
}

export async function unsubscribeAlert(token: string) {
  const alert = await prisma.priceAlert.findFirst({ where: { unsubTokenHash: hashToken(token) } });
  if (!alert) {
    throw new AppError(404, "NOT_FOUND", "Alert not found");
  }
  await prisma.priceAlert.update({ where: { id: alert.id }, data: { isActive: false } });
  return { ok: true };
}

export async function dispatchAlertsForOffer(offerId: string): Promise<number> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { product: { select: { id: true, title: true, slug: true } } },
  });
  if (!offer || offer.price == null || !offer.inStock) {
    return 0;
  }
  const events = await prisma.priceEvent.findMany({
    where: { offerId, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
    select: { type: true, percent: true },
  });
  if (events.length === 0) {
    return 0;
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { productId: offer.productId, isActive: true, emailVerifiedAt: { not: null } },
  });
  const currentPrice = Number(offer.price);
  let sent = 0;
  for (const alert of alerts) {
    if (!alertMatches(alert, events, currentPrice)) {
      continue;
    }
    if (alert.lastTriggeredAt && Date.now() - alert.lastTriggeredAt.getTime() < 12 * 60 * 60 * 1000) {
      continue;
    }
    const unsubToken = createToken();
    const delivered = await sendEmail({
      to: alert.email,
      subject: `Price update: ${offer.product.title}`,
      text: `${offer.product.title} is now ₹${currentPrice.toFixed(0)}.\nSee it: ${siteLink(`/products/${offer.product.slug}`)}\n\nUnsubscribe: ${siteLink(`/alerts/unsubscribe?token=${unsubToken}`)}\n\n${PRIVACY}`,
    });
    if (!delivered) {
      continue;
    }
    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { lastTriggeredAt: new Date(), unsubTokenHash: hashToken(unsubToken) },
    });
    sent += 1;
  }
  return sent;
}

export async function enqueueAlertDispatch(offerId: string) {
  return enqueueJob("ALERT_DISPATCH", { offerId }, { priority: 20 });
}

export async function listAlerts() {
  const alerts = await prisma.priceAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { id: true, title: true, slug: true } } },
  });
  return alerts.map((alert) => ({
    id: alert.id,
    email: alert.email,
    type: alert.type,
    targetPrice: alert.targetPrice != null ? String(alert.targetPrice) : null,
    percentThreshold: alert.percentThreshold != null ? String(alert.percentThreshold) : null,
    isActive: alert.isActive,
    emailVerifiedAt: alert.emailVerifiedAt?.toISOString() ?? null,
    lastTriggeredAt: alert.lastTriggeredAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
    offerId: alert.offerId,
    product: alert.product,
  }));
}
