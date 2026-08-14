import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { isSafeHttpUrl, truncate } from "../../lib/url.js";

type ClickContext = {
  referrer?: string;
  userAgent?: string;
};

export async function recordProductClick(slug: string, context: ClickContext) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
    select: {
      id: true,
      isActive: true,
      affiliateUrl: true,
      source: true,
    },
  });

  if (!product || !product.isActive) {
    throw new AppError(404, "NOT_FOUND", "This product is not available.");
  }

  if (!isSafeHttpUrl(product.affiliateUrl)) {
    throw new AppError(409, "UNAVAILABLE", "This offer is currently unavailable.");
  }

  await prisma.affiliateClick.create({
    data: {
      productId: product.id,
      source: product.source,
      referrer: truncate(context.referrer, 2000),
      userAgent: truncate(context.userAgent, 1000),
    },
  });

  return { url: product.affiliateUrl };
}
