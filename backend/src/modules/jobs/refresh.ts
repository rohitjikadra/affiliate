import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { AdapterDisabledError, type MerchantAdapter } from "../integrations/types.js";
import { getAdapter } from "../integrations/registry.js";
import { validateNormalizedOffer } from "../integrations/amazon.js";
import { recordPriceSnapshot } from "../pricing/snapshot.js";
import { recordPriceEvents } from "../pricing/events.js";
import { enqueueJob } from "./queue.js";
import type { AvailabilityStatus, OfferFetchStatus } from "../../generated/prisma/client.js";

const MAX_FAILURES = 8;

export function nextSuccessAt(now = Date.now()): Date {
  return new Date(now + (45 + Math.random() * 15) * 60 * 1000);
}

export function nextFailureAt(failures: number, now = Date.now()): Date {
  return new Date(now + Math.min(24 * 60, 5 * 2 ** Math.max(0, failures - 1)) * 60 * 1000);
}

export function shouldPauseFetching(failures: number): boolean {
  return failures >= MAX_FAILURES;
}

export async function refreshOffer(offerId: string, adapterOverride?: MerchantAdapter | null): Promise<void> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { merchant: true, product: { select: { id: true, slug: true } } },
  });
  if (!offer) {
    return;
  }

  const adapter = adapterOverride ?? getAdapter(offer.merchant.integrationKey ?? "", offer.merchant.defaultTag);
  if (!adapter?.enabled) {
    await prisma.offer.update({
      where: { id: offer.id },
      data: { fetchStatus: "NEVER", fetchError: "Adapter disabled", nextFetchAt: nextFailureAt(1) },
    });
    return;
  }
  if (!offer.externalId) {
    await prisma.offer.update({
      where: { id: offer.id },
      data: { fetchStatus: "INVALID", fetchError: "Missing external id", nextFetchAt: null },
    });
    return;
  }

  try {
    const [item] = await adapter.lookup([offer.externalId]);
    if (!item) {
      throw new Error("Empty lookup");
    }
    const invalid = validateNormalizedOffer(item);
    if (invalid) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          lastCheckedAt: new Date(),
          fetchStatus: "INVALID",
          fetchError: invalid,
          nextFetchAt: null,
        },
      });
      return;
    }

    const inStock = item.availability !== "OUT_OF_STOCK";
    const availability: AvailabilityStatus =
      item.availability === "IN_STOCK" ? "IN_STOCK" : item.availability === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "UNKNOWN";
    const fetchStatus: OfferFetchStatus = "SUCCESS";
    const previousPrice = offer.price != null ? Number(offer.price) : null;

    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        title: item.title ?? offer.title,
        price: item.price,
        originalPrice: item.originalPrice,
        currency: item.currency,
        productUrl: item.productUrl,
        affiliateUrl: item.affiliateUrl ?? offer.affiliateUrl,
        inStock,
        availability,
        lastCheckedAt: item.fetchedAt,
        lastSuccessfulFetchAt: item.fetchedAt,
        nextFetchAt: nextSuccessAt(),
        fetchStatus,
        fetchError: null,
        consecutiveFailures: 0,
      },
    });

    await recordPriceSnapshot({
      offerId: offer.id,
      price: item.price,
      currency: item.currency,
      originalPrice: item.originalPrice,
      availability,
      inStock,
      source: "AMAZON_CREATORS",
      fetchStatus,
    });

    const events = await recordPriceEvents({
      productId: offer.productId,
      offerId: offer.id,
      previousPrice,
      currentPrice: item.price,
      previousInStock: offer.inStock,
      currentInStock: inStock,
    });
    if (events.length > 0) {
      await enqueueJob("ALERT_DISPATCH", { offerId: offer.id }, { priority: 20 });
    }
    await enqueueJob(
      "REVALIDATE",
      { path: `/products/${offer.product.slug}`, paths: [`/products/${offer.product.slug}`, "/products"] },
      { priority: 1 },
    );
  } catch (error) {
    if (error instanceof AdapterDisabledError) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { fetchStatus: "NEVER", fetchError: error.message, nextFetchAt: nextFailureAt(1) },
      });
      return;
    }
    const message = error instanceof Error ? error.message : "Fetch failed";
    const failures = offer.consecutiveFailures + 1;
    const paused = shouldPauseFetching(failures);
    logger.warn("offer_refresh_failed", { offerId, message, failures });
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        lastCheckedAt: new Date(),
        fetchStatus: message.includes("429") ? "RATE_LIMITED" : "ERROR",
        fetchError: message.slice(0, 1000),
        consecutiveFailures: failures,
        nextFetchAt: paused ? null : nextFailureAt(failures),
      },
    });
    throw error;
  }
}

export async function revalidatePath(path: string | string[]): Promise<void> {
  if (!env.siteUrl || !env.revalidateSecret) {
    return;
  }
  const paths = (Array.isArray(path) ? path : [path]).filter((value) => value.startsWith("/"));
  if (paths.length === 0) {
    return;
  }
  await fetch(`${env.siteUrl.replace(/\/$/, "")}/admin/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.revalidateSecret}`,
    },
    body: JSON.stringify({ paths }),
  }).catch(() => undefined);
}
