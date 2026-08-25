import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";
import { getAdapter } from "../integrations/registry.js";
import { enqueueJob } from "../jobs/queue.js";
import type { DiscoveryCandidate, NormalizedOffer } from "../integrations/types.js";
import { chunkAsins, decideImportAction, parseImportAsins, publishBlockReason, taggedAmazonUrl } from "./import.match.js";

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "imported-product";
  let slug = root;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

async function amazonMerchant() {
  const amazon = await prisma.merchant.findFirst({
    where: { OR: [{ integrationKey: "AMAZON_IN" }, { slug: "amazon" }] },
  });
  if (!amazon) {
    throw new AppError(400, "VALIDATION_ERROR", "Amazon merchant is not configured");
  }
  return amazon;
}

async function lookupAsins(ids: string[], partnerTag: string | null): Promise<Map<string, NormalizedOffer>> {
  const adapter = getAdapter("AMAZON_IN", partnerTag);
  const byId = new Map<string, NormalizedOffer>();
  if (!adapter?.enabled) {
    return byId;
  }
  for (const batch of chunkAsins(ids, 10)) {
    const lookedUp = await adapter.lookup(batch).catch(() => []);
    for (const item of lookedUp) {
      byId.set(item.externalId, item);
    }
  }
  return byId;
}

async function ensureAsinIdentifier(productId: string, asin: string, merchantId: string) {
  const existing = await prisma.productIdentifier.findUnique({
    where: { type_value: { type: "ASIN", value: asin } },
  });
  if (existing) {
    return;
  }
  await prisma.productIdentifier.create({
    data: { productId, type: "ASIN", value: asin, merchantId },
  });
}

export async function searchCatalog(query: string) {
  const amazon = await amazonMerchant();
  const adapter = getAdapter("AMAZON_IN", amazon.defaultTag);
  if (!adapter?.enabled || !adapter.search) {
    return { enabled: false, items: [] as DiscoveryCandidate[] };
  }
  try {
    const items = await adapter.search(query);
    return { enabled: true, items };
  } catch {
    return { enabled: true, items: [] };
  }
}

export async function enqueueProductImport(asins: string[], categoryId?: string | null) {
  const ids = parseImportAsins(asins);
  if (ids.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Provide at least one ASIN");
  }
  return enqueueJob("PRODUCT_IMPORT", { asins: ids, categoryId: categoryId ?? null }, { priority: 5 });
}

export async function importAsins(asins: string[], categoryId?: string | null) {
  const ids = parseImportAsins(asins);
  if (ids.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Provide at least one ASIN");
  }
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) {
      throw new AppError(400, "VALIDATION_ERROR", "Selected category does not exist");
    }
  }

  const amazon = await amazonMerchant();
  const byId = await lookupAsins(ids, amazon.defaultTag);
  const created: { id: string; slug: string; asin: string; status: string }[] = [];
  const attached: { productId: string; asin: string; action: "attach-offer" | "refresh-offer" }[] = [];

  for (const asin of ids) {
    const existingIdentifier = await prisma.productIdentifier.findUnique({
      where: { type_value: { type: "ASIN", value: asin } },
    });
    const offerOnIdentifier = existingIdentifier
      ? await prisma.offer.findFirst({
          where: { productId: existingIdentifier.productId, merchantId: amazon.id, externalId: asin },
        })
      : null;
    const existingOffer =
      offerOnIdentifier ??
      (await prisma.offer.findFirst({
        where: { merchantId: amazon.id, externalId: asin },
      }));
    const action = decideImportAction({
      identifierProductId: existingIdentifier?.productId ?? null,
      offerId: existingOffer?.id ?? null,
      offerProductId: existingOffer?.productId ?? null,
    });
    const productId = existingIdentifier?.productId ?? existingOffer?.productId ?? null;

    if (action === "refresh-offer" && existingOffer) {
      await ensureAsinIdentifier(existingOffer.productId, asin, amazon.id);
      await enqueueJob("PRICE_REFRESH", { offerId: existingOffer.id }, { priority: 10 });
      attached.push({ productId: existingOffer.productId, asin, action });
      continue;
    }

    if (action === "attach-offer" && productId) {
      await ensureAsinIdentifier(productId, asin, amazon.id);
      const item = byId.get(asin);
      const offer = await prisma.offer.create({
        data: {
          productId,
          merchantId: amazon.id,
          title: item?.title ?? null,
          price: item?.price ?? null,
          originalPrice: item?.originalPrice ?? null,
          currency: item?.currency ?? "INR",
          externalId: asin,
          affiliateUrl: item?.affiliateUrl ?? taggedAmazonUrl(asin, amazon.defaultTag),
          productUrl: item?.productUrl ?? `https://www.amazon.in/dp/${asin}`,
          inStock: item?.availability !== "OUT_OF_STOCK",
          availability:
            item?.availability === "OUT_OF_STOCK"
              ? "OUT_OF_STOCK"
              : item?.availability === "IN_STOCK"
                ? "IN_STOCK"
                : "UNKNOWN",
          nextFetchAt: new Date(),
          fetchStatus: "QUEUED",
        },
      });
      await enqueueJob("PRICE_REFRESH", { offerId: offer.id }, { priority: 10 });
      attached.push({ productId, asin, action });
      continue;
    }

    const item = byId.get(asin);
    const title = item?.title ?? `Amazon product ${asin}`;
    const slug = await uniqueSlug(slugify(title));
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        source: "AMAZON",
        sourceId: asin,
        brand: item?.brand ?? null,
        imageUrl: item?.imageUrls[0] ?? null,
        images: item?.imageUrls ?? [],
        status: "DRAFT",
        isActive: false,
        categoryId: categoryId ?? null,
        identifiers: { create: { type: "ASIN", value: asin, merchantId: amazon.id } },
        offers: {
          create: {
            merchantId: amazon.id,
            title,
            price: item?.price ?? null,
            originalPrice: item?.originalPrice ?? null,
            currency: item?.currency ?? "INR",
            affiliateUrl: item?.affiliateUrl ?? taggedAmazonUrl(asin, amazon.defaultTag),
            productUrl: item?.productUrl ?? `https://www.amazon.in/dp/${asin}`,
            externalId: asin,
            inStock: item?.availability !== "OUT_OF_STOCK",
            availability:
              item?.availability === "OUT_OF_STOCK"
                ? "OUT_OF_STOCK"
                : item?.availability === "IN_STOCK"
                  ? "IN_STOCK"
                  : "UNKNOWN",
            isPrimary: true,
            nextFetchAt: new Date(),
            fetchStatus: "QUEUED",
          },
        },
      },
      include: { offers: true },
    });
    const offerId = product.offers[0]?.id;
    if (offerId) {
      await enqueueJob("PRICE_REFRESH", { offerId }, { priority: 10 });
    }
    created.push({ id: product.id, slug: product.slug, asin, status: product.status });
  }

  return { created, attached };
}

export async function publishProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { offers: true },
  });
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }
  const blocked = publishBlockReason(product.offers);
  if (blocked) {
    throw new AppError(400, "VALIDATION_ERROR", blocked);
  }
  return prisma.product.update({
    where: { id },
    data: { status: "PUBLISHED", isActive: true, publishedAt: product.publishedAt ?? new Date() },
  });
}
