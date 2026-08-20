import type { ProductSource } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { isSafeHttpUrl, truncate } from "../../lib/url.js";
import { applyAmazonTag } from "../affiliates/amazon.js";

export type ClickContext = {
  referrer?: string;
  userAgent?: string;
  landingPath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipHash?: string;
  device?: string;
};

function mapSource(network: string | null | undefined, fallback: ProductSource): ProductSource {
  if (network === "AMAZON") {
    return "AMAZON";
  }
  if (network === "FLIPKART") {
    return "FLIPKART";
  }
  return fallback;
}

async function writeClick(input: {
  productId: string;
  offerId?: string | null;
  merchantId?: string | null;
  source: ProductSource;
  context: ClickContext;
}) {
  await prisma.affiliateClick.create({
    data: {
      productId: input.productId,
      offerId: input.offerId ?? undefined,
      merchantId: input.merchantId ?? undefined,
      source: input.source,
      referrer: truncate(input.context.referrer, 2000),
      userAgent: truncate(input.context.userAgent, 1000),
      landingPath: truncate(input.context.landingPath, 500),
      utmSource: truncate(input.context.utmSource, 100),
      utmMedium: truncate(input.context.utmMedium, 100),
      utmCampaign: truncate(input.context.utmCampaign, 100),
      ipHash: input.context.ipHash,
      device: input.context.device,
    },
  });
}

export async function recordOfferClick(offerId: string, context: ClickContext) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      merchant: true,
      product: {
        select: {
          id: true,
          isActive: true,
          source: true,
        },
      },
    },
  });

  if (!offer || !offer.product.isActive || !offer.merchant.isActive || !offer.inStock) {
    throw new AppError(404, "NOT_FOUND", "This offer is not available.");
  }

  const destination = applyAmazonTag(offer.affiliateUrl, offer.merchant.defaultTag);
  if (!isSafeHttpUrl(destination)) {
    throw new AppError(409, "UNAVAILABLE", "This offer is currently unavailable.");
  }

  await writeClick({
    productId: offer.productId,
    offerId: offer.id,
    merchantId: offer.merchantId,
    source: mapSource(offer.merchant.network, offer.product.source),
    context,
  });

  return { url: destination };
}

export async function recordProductClick(slug: string, context: ClickContext) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    include: {
      offers: {
        where: { inStock: true, merchant: { isActive: true } },
        include: { merchant: true },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      },
    },
  });

  if (!product || !product.isActive) {
    throw new AppError(404, "NOT_FOUND", "This product is not available.");
  }

  const primary = product.offers[0];
  if (primary) {
    return recordOfferClick(primary.id, context);
  }

  const destination = isSafeHttpUrl(product.affiliateUrl) ? product.affiliateUrl : null;
  if (!destination) {
    throw new AppError(409, "UNAVAILABLE", "This offer is currently unavailable.");
  }

  await writeClick({
    productId: product.id,
    source: product.source,
    context,
  });

  return { url: destination };
}
