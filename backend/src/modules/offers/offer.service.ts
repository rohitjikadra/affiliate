import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { resolveAffiliateUrl } from "../affiliates/resolve.js";
import type { CreateOfferInput, UpdateOfferInput } from "./offer.schemas.js";
import { serializeOffer } from "./offer.serializer.js";
import { recordPriceSnapshot } from "../pricing/snapshot.js";

const offerInclude = {
  merchant: {
    select: {
      id: true,
      slug: true,
      name: true,
      kind: true,
      network: true,
      isActive: true,
      defaultTag: true,
      disclosure: true,
    },
  },
} as const;

async function snapshotPrice(
  offerId: string,
  price: number | null | undefined,
  currency: string,
  extra: { originalPrice?: number | null; inStock?: boolean } = {},
) {
  const inStock = extra.inStock ?? true;
  await recordPriceSnapshot({
    offerId,
    price,
    currency,
    originalPrice: extra.originalPrice ?? null,
    availability: inStock ? "IN_STOCK" : "OUT_OF_STOCK",
    inStock,
    source: "ADMIN",
    fetchStatus: "SUCCESS",
  });
}

async function clearPrimary(productId: string, exceptId?: string) {
  await prisma.offer.updateMany({
    where: {
      productId,
      isPrimary: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isPrimary: false },
  });
}

export async function listOffersForProduct(productId: string, options: { includeAffiliateUrl?: boolean } = {}) {
  const offers = await prisma.offer.findMany({
    where: { productId },
    include: offerInclude,
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });
  return offers.map((offer) =>
    serializeOffer(offer, { includeAffiliateUrl: options.includeAffiliateUrl ?? false }),
  );
}

export async function createOffer(productId: string, input: CreateOfferInput) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId } });
  if (!merchant) {
    throw new AppError(400, "VALIDATION_ERROR", "Selected merchant does not exist");
  }

  if (input.isPrimary) {
    await clearPrimary(productId);
  }

  const affiliateUrl = resolveAffiliateUrl(input.affiliateUrl, merchant);

  const offer = await prisma.offer.create({
    data: {
      productId,
      merchantId: input.merchantId,
      title: input.title,
      price: input.price,
      originalPrice: input.originalPrice,
      currency: input.currency,
      affiliateUrl,
      externalId: input.externalId ?? "",
      inStock: input.inStock,
      isPrimary: input.isPrimary,
      availability: input.inStock ? "IN_STOCK" : "OUT_OF_STOCK",
      lastCheckedAt: new Date(),
    },
    include: offerInclude,
  });

  await snapshotPrice(offer.id, input.price ?? null, input.currency, {
    originalPrice: input.originalPrice ?? null,
    inStock: input.inStock,
  });

  return serializeOffer(offer, { includeAffiliateUrl: true });
}

export async function updateOffer(productId: string, offerId: string, input: UpdateOfferInput) {
  const existing = await prisma.offer.findFirst({
    where: { id: offerId, productId },
    include: { merchant: true },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Offer not found");
  }

  if (input.merchantId) {
    const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId } });
    if (!merchant) {
      throw new AppError(400, "VALIDATION_ERROR", "Selected merchant does not exist");
    }
  }

  if (input.isPrimary) {
    await clearPrimary(productId, offerId);
  }

  const merchantForTag =
    input.merchantId && input.merchantId !== existing.merchantId
      ? await prisma.merchant.findUnique({ where: { id: input.merchantId } })
      : existing.merchant;

  const affiliateUrl =
    input.affiliateUrl !== undefined
      ? resolveAffiliateUrl(input.affiliateUrl, merchantForTag ?? existing.merchant)
      : undefined;

  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      ...(input.merchantId !== undefined ? { merchantId: input.merchantId } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(affiliateUrl !== undefined ? { affiliateUrl } : {}),
      ...(input.externalId !== undefined ? { externalId: input.externalId ?? "" } : {}),
      ...(input.inStock !== undefined
        ? { inStock: input.inStock, availability: input.inStock ? "IN_STOCK" : "OUT_OF_STOCK" }
        : {}),
      ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
      lastCheckedAt: new Date(),
    },
    include: offerInclude,
  });

  if (input.price !== undefined && input.price !== Number(existing.price)) {
    await snapshotPrice(offer.id, input.price, input.currency ?? existing.currency, {
      originalPrice: input.originalPrice ?? Number(existing.originalPrice) ?? null,
      inStock: offer.inStock,
    });
  }

  return serializeOffer(offer, { includeAffiliateUrl: true });
}

export async function deleteOffer(productId: string, offerId: string) {
  const existing = await prisma.offer.findFirst({
    where: { id: offerId, productId },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Offer not found");
  }
  await prisma.offer.delete({ where: { id: offerId } });
  return { id: offerId };
}
