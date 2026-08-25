import type { IdentifierType, Merchant, ProductSource } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";
import { resolveAffiliateUrl } from "../affiliates/resolve.js";
import { getAdapter } from "../integrations/registry.js";
import type { DiscoveryCandidate, MerchantAdapter, NormalizedOffer } from "../integrations/types.js";
import { enqueueJob } from "../jobs/queue.js";
import { chunkIds, catalogIdentifiersFromItem, decideImportAction, globalCatalogIdentifiers, isMerchantScopedType, matchedProductId, publishBlockReason } from "./import.match.js";

export type ImportProductsInput = {
  merchantId?: string | null;
  externalIds?: string[];
  asins?: string[];
  categoryId?: string | null;
};

export type ImportResultRow = {
  id: string;
  slug: string;
  asin: string;
  externalId: string;
  status: string;
};

export type ImportAttachedRow = {
  productId: string;
  asin: string;
  externalId: string;
  action: "attach-offer" | "refresh-offer";
};

export type ImportReviewRow = {
  productIds: string[];
  asin: string;
  externalId: string;
  reason: "ambiguous-match";
};

async function uniqueSlug(base: string): Promise<string> {
  const root = base || "imported-product";
  let slug = root;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function parseProductImportPayload(payload: unknown): ImportProductsInput {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const asins = asStringArray(data.asins);
  const externalIds = asStringArray(data.externalIds);
  return {
    merchantId: typeof data.merchantId === "string" && data.merchantId.trim() ? data.merchantId : undefined,
    asins: asins.length > 0 ? asins : undefined,
    externalIds: externalIds.length > 0 ? externalIds : undefined,
    categoryId: typeof data.categoryId === "string" ? data.categoryId : null,
  };
}

function rawImportIds(input: ImportProductsInput): string[] {
  return [...(input.externalIds ?? []), ...(input.asins ?? [])];
}

function parseIds(adapter: MerchantAdapter, raw: string[]): string[] {
  if (adapter.parseExternalIds) {
    return adapter.parseExternalIds(raw);
  }
  return [...new Set(raw.map((value) => value.trim()).filter(Boolean))];
}

function emptyIdsMessage(adapter: MerchantAdapter): string {
  return adapter.emptyIdsMessage ?? "Provide at least one product id";
}

function catalogMeta(adapter: MerchantAdapter, merchantName: string): {
  identifierType: IdentifierType;
  source: ProductSource;
  untitled: (id: string) => string;
} {
  return {
    identifierType: adapter.listingIdentifierType ?? "MERCHANT_ID",
    source: adapter.productSource ?? "MANUAL",
    untitled: (id) => `${merchantName} product ${id}`,
  };
}

async function defaultImportMerchant() {
  // V1 has one live adapter. Omitting merchantId keeps Amazon `{ asins }` jobs working.
  const amazon = await prisma.merchant.findFirst({
    where: { OR: [{ integrationKey: "AMAZON_IN" }, { slug: "amazon" }] },
  });
  if (!amazon) {
    throw new AppError(400, "VALIDATION_ERROR", "Amazon merchant is not configured");
  }
  return amazon;
}

async function resolveImportMerchant(merchantId?: string | null) {
  if (merchantId) {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      throw new AppError(400, "VALIDATION_ERROR", "Selected merchant does not exist");
    }
    return merchant;
  }
  return defaultImportMerchant();
}

function requireAdapter(merchant: Merchant): MerchantAdapter {
  const adapter = getAdapter(merchant.integrationKey ?? "", merchant.defaultTag);
  if (!adapter) {
    throw new AppError(400, "VALIDATION_ERROR", "This merchant does not support catalog import");
  }
  return adapter;
}

async function lookupExternalIds(adapter: MerchantAdapter, ids: string[]): Promise<Map<string, NormalizedOffer>> {
  const byId = new Map<string, NormalizedOffer>();
  if (!adapter.enabled) {
    return byId;
  }
  for (const batch of chunkIds(ids, 10)) {
    const lookedUp = await adapter.lookup(batch).catch(() => []);
    for (const item of lookedUp) {
      byId.set(item.externalId, item);
    }
  }
  return byId;
}

async function findGlobalProductId(refs: { type: IdentifierType; value: string }[]): Promise<string | string[] | null> {
  const globalRefs = globalCatalogIdentifiers(refs);
  if (globalRefs.length === 0) {
    return null;
  }
  const rows = await prisma.productIdentifier.findMany({
    where: {
      OR: globalRefs.map((ref) => ({ type: ref.type, value: ref.value })),
    },
    select: { productId: true },
  });
  const productIds = [...new Set(rows.map((row) => row.productId))];
  if (productIds.length === 0) {
    return null;
  }
  if (productIds.length > 1) {
    return productIds;
  }
  return productIds[0];
}

async function findListingIdentifier(type: IdentifierType, value: string, merchantId: string) {
  if (isMerchantScopedType(type)) {
    return prisma.productIdentifier.findFirst({
      where: { type, value, merchantId },
    });
  }
  return prisma.productIdentifier.findFirst({
    where: { type, value },
  });
}

async function ensureIdentifier(productId: string, type: IdentifierType, value: string, merchantId: string) {
  const existing = isMerchantScopedType(type)
    ? await prisma.productIdentifier.findFirst({ where: { type, value, merchantId } })
    : await prisma.productIdentifier.findFirst({ where: { type, value } });
  if (existing) {
    return;
  }
  await prisma.productIdentifier.create({
    data: { productId, type, value, merchantId },
  });
}

async function ensureIdentifiers(
  productId: string,
  refs: { type: IdentifierType; value: string }[],
  merchantId: string,
) {
  for (const ref of refs) {
    await ensureIdentifier(productId, ref.type, ref.value, merchantId);
  }
}

function offerUrls(adapter: MerchantAdapter, merchant: Merchant, externalId: string, item?: NormalizedOffer | null) {
  const fallback = adapter.fallbackUrls?.(externalId, merchant.defaultTag);
  return {
    productUrl: item?.productUrl ?? fallback?.productUrl ?? null,
    affiliateUrl: resolveAffiliateUrl(item?.affiliateUrl ?? fallback?.affiliateUrl ?? "", merchant),
  };
}

function stockFields(item?: NormalizedOffer | null) {
  return {
    inStock: item?.availability !== "OUT_OF_STOCK",
    availability:
      item?.availability === "OUT_OF_STOCK"
        ? ("OUT_OF_STOCK" as const)
        : item?.availability === "IN_STOCK"
          ? ("IN_STOCK" as const)
          : ("UNKNOWN" as const),
  };
}

export async function searchCatalog(query: string) {
  const amazon = await defaultImportMerchant();
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
  return enqueueImportJob({ asins, categoryId });
}

export async function enqueueImportJob(input: ImportProductsInput) {
  const merchant = await resolveImportMerchant(input.merchantId);
  const adapter = requireAdapter(merchant);
  const ids = parseIds(adapter, rawImportIds(input));
  if (ids.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", emptyIdsMessage(adapter));
  }
  return enqueueJob(
    "PRODUCT_IMPORT",
    {
      merchantId: merchant.id,
      externalIds: ids,
      ...(adapter.key === "AMAZON_IN" ? { asins: ids } : {}),
      categoryId: input.categoryId ?? null,
    },
    { priority: 5 },
  );
}

export async function importAsins(asins: string[], categoryId?: string | null) {
  return importProducts({ asins, categoryId });
}

export async function importProducts(input: ImportProductsInput) {
  const merchant = await resolveImportMerchant(input.merchantId);
  const adapter = requireAdapter(merchant);
  const ids = parseIds(adapter, rawImportIds(input));
  if (ids.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", emptyIdsMessage(adapter));
  }
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!category) {
      throw new AppError(400, "VALIDATION_ERROR", "Selected category does not exist");
    }
  }

  const meta = catalogMeta(adapter, merchant.name);
  const byId = await lookupExternalIds(adapter, ids);
  const created: ImportResultRow[] = [];
  const attached: ImportAttachedRow[] = [];
  const review: ImportReviewRow[] = [];

  for (const externalId of ids) {
    const item = byId.get(externalId) ?? null;
    const identifierRefs = catalogIdentifiersFromItem(item, meta.identifierType, externalId);
    const globalMatch = await findGlobalProductId(identifierRefs);
    if (Array.isArray(globalMatch)) {
      review.push({
        productIds: globalMatch,
        asin: externalId,
        externalId,
        reason: "ambiguous-match",
      });
      continue;
    }

    const listingIdentifier = await findListingIdentifier(meta.identifierType, externalId, merchant.id);
    const existingOffer = await prisma.offer.findFirst({
      where: { merchantId: merchant.id, externalId },
    });
    const matchInput = {
      globalProductId: globalMatch,
      identifierProductId: listingIdentifier?.productId ?? null,
      offerId: existingOffer?.id ?? null,
      offerProductId: existingOffer?.productId ?? null,
    };
    const action = decideImportAction(matchInput);
    const productId = matchedProductId(matchInput);

    if (action === "review") {
      review.push({
        productIds: [...new Set([globalMatch, listingIdentifier?.productId, existingOffer?.productId].filter((id): id is string => Boolean(id)))],
        asin: externalId,
        externalId,
        reason: "ambiguous-match",
      });
      continue;
    }

    if (action === "refresh-offer" && existingOffer) {
      await ensureIdentifiers(existingOffer.productId, identifierRefs, merchant.id);
      await enqueueJob("PRICE_REFRESH", { offerId: existingOffer.id }, { priority: 10 });
      attached.push({ productId: existingOffer.productId, asin: externalId, externalId, action });
      continue;
    }

    if (action === "attach-offer" && productId) {
      await ensureIdentifiers(productId, identifierRefs, merchant.id);
      const urls = offerUrls(adapter, merchant, externalId, item);
      const stock = stockFields(item);
      const offer = await prisma.offer.create({
        data: {
          productId,
          merchantId: merchant.id,
          title: item?.title ?? null,
          price: item?.price ?? null,
          originalPrice: item?.originalPrice ?? null,
          currency: item?.currency ?? "INR",
          externalId,
          affiliateUrl: urls.affiliateUrl,
          productUrl: urls.productUrl,
          inStock: stock.inStock,
          availability: stock.availability,
          nextFetchAt: new Date(),
          fetchStatus: "QUEUED",
        },
      });
      await enqueueJob("PRICE_REFRESH", { offerId: offer.id }, { priority: 10 });
      attached.push({ productId, asin: externalId, externalId, action });
      continue;
    }

    const title = item?.title ?? meta.untitled(externalId);
    const slug = await uniqueSlug(slugify(title));
    const urls = offerUrls(adapter, merchant, externalId, item);
    const stock = stockFields(item);
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        source: meta.source,
        sourceId: externalId,
        brand: item?.brand ?? null,
        imageUrl: item?.imageUrls[0] ?? null,
        images: item?.imageUrls ?? [],
        status: "DRAFT",
        isActive: false,
        categoryId: input.categoryId ?? null,
        identifiers: {
          create: identifierRefs.map((ref) => ({
            type: ref.type,
            value: ref.value,
            merchantId: merchant.id,
          })),
        },
        offers: {
          create: {
            merchantId: merchant.id,
            title,
            price: item?.price ?? null,
            originalPrice: item?.originalPrice ?? null,
            currency: item?.currency ?? "INR",
            affiliateUrl: urls.affiliateUrl,
            productUrl: urls.productUrl,
            externalId,
            inStock: stock.inStock,
            availability: stock.availability,
            // First offer on a new product is Recommended (editorial first-offer policy), not Amazon-specific.
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
    created.push({
      id: product.id,
      slug: product.slug,
      asin: externalId,
      externalId,
      status: product.status,
    });
  }

  return { created, attached, review };
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
