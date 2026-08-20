import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { normalizePagination, paginationMeta } from "../../lib/pagination.js";
import { slugify } from "../../lib/slug.js";
import { findSlugRedirect, recordSlugChange } from "../../lib/slug-redirect.js";
import { productInclude } from "../products/product.service.js";
import { serializeProduct } from "../products/product.serializer.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateComparisonInput, ListComparisonsQuery, UpdateComparisonInput } from "./comparison.schemas.js";

const comparisonInclude = {
  winner: {
    select: { id: true, slug: true, title: true },
  },
  items: {
    include: {
      product: {
        include: productInclude as Prisma.ProductInclude,
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
} as Prisma.ComparisonInclude;

function serializeComparison(comparison: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  published: boolean;
  winnerProductId: string | null;
  methodology: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  winner?: { id: string; slug: string; title: string } | null;
  items?: { id: string; sortOrder: number; notes: string | null; product: Parameters<typeof serializeProduct>[0] }[];
}, options: { includeBody?: boolean } = {}) {
  const includeBody = options.includeBody ?? true;
  return {
    id: comparison.id,
    slug: comparison.slug,
    title: comparison.title,
    excerpt: comparison.excerpt,
    body: includeBody ? comparison.body : "",
    published: comparison.published,
    winnerProductId: comparison.winnerProductId,
    winner: comparison.winner ?? null,
    methodology: includeBody ? comparison.methodology : null,
    seoTitle: comparison.seoTitle,
    seoDescription: comparison.seoDescription,
    items: (comparison.items ?? []).map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      notes: item.notes,
      product: serializeProduct(item.product, { includeAffiliateUrl: false }),
    })),
    createdAt: comparison.createdAt.toISOString(),
    updatedAt: comparison.updatedAt.toISOString(),
  };
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const existing = await prisma.comparison.findUnique({ where: { slug }, select: { id: true } });
  if (!existing || existing.id === excludeId) {
    return slug;
  }
  if (excludeId) {
    throw new AppError(409, "CONFLICT", "Slug is already in use");
  }
  return `${slug}-${Date.now().toString(36)}`;
}

async function syncItems(comparisonId: string, items: CreateComparisonInput["items"] | undefined) {
  if (!items) {
    return;
  }

  const ids = items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Duplicate products are not allowed");
  }

  const count = await prisma.product.count({ where: { id: { in: ids } } });
  if (count !== ids.length) {
    throw new AppError(400, "VALIDATION_ERROR", "One or more products do not exist");
  }

  await prisma.$transaction([
    prisma.comparisonItem.deleteMany({ where: { comparisonId } }),
    prisma.comparisonItem.createMany({
      data: items.map((item, index) => ({
        comparisonId,
        productId: item.productId,
        sortOrder: item.sortOrder ?? index,
        notes: item.notes ?? null,
      })),
    }),
  ]);
}

async function findComparison(idOrSlug: string, options: { isAdmin?: boolean } = {}) {
  const comparison = await prisma.comparison.findFirst({
    where: { OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
    include: comparisonInclude,
  });

  if (!comparison) {
    const toSlug = await findSlugRedirect("comparison", idOrSlug);
    if (toSlug) {
      throw new AppError(308, "MOVED_PERMANENTLY", "This comparison has moved", {
        toSlug,
        entityType: "comparison",
      });
    }
    throw new AppError(404, "NOT_FOUND", "Comparison not found");
  }

  if (!options.isAdmin && !comparison.published) {
    throw new AppError(404, "NOT_FOUND", "Comparison not found");
  }

  return comparison;
}

export async function listComparisons(
  query: ListComparisonsQuery = {},
  options: { includeUnpublished?: boolean } = {},
) {
  const includeUnpublished = options.includeUnpublished ?? false;
  const { skip, take, page, limit } = normalizePagination(query);
  const where = includeUnpublished ? {} : { published: true };

  const [items, total] = await Promise.all([
    prisma.comparison.findMany({
      where,
      include: comparisonInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    prisma.comparison.count({ where }),
  ]);

  return {
    items: items.map((item) => serializeComparison(item as never, { includeBody: false })),
    meta: paginationMeta(total, page, limit),
  };
}

export async function getComparisonByIdOrSlug(idOrSlug: string, options: { isAdmin?: boolean } = {}) {
  const comparison = await findComparison(idOrSlug, options);
  return serializeComparison(comparison as never, { includeBody: true });
}

export async function createComparison(input: CreateComparisonInput) {
  if (input.winnerProductId && !input.items.some((item) => item.productId === input.winnerProductId)) {
    throw new AppError(400, "VALIDATION_ERROR", "Winner must be one of the compared products");
  }

  const slug = await ensureUniqueSlug(input.slug ?? slugify(input.title));
  const comparison = await prisma.comparison.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      body: input.body,
      published: input.published,
      winnerProductId: input.winnerProductId,
      methodology: input.methodology,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
    },
  });

  await syncItems(comparison.id, input.items);
  return getComparisonByIdOrSlug(comparison.id, { isAdmin: true });
}

export async function updateComparison(idOrSlug: string, input: UpdateComparisonInput) {
  const existing = await findComparison(idOrSlug, { isAdmin: true });
  const slug =
    input.slug !== undefined && input.slug !== existing.slug
      ? await ensureUniqueSlug(input.slug, existing.id)
      : undefined;

  if (slug) {
    await recordSlugChange("comparison", existing.slug, slug);
  }

  if (input.winnerProductId && input.items && !input.items.some((item) => item.productId === input.winnerProductId)) {
    throw new AppError(400, "VALIDATION_ERROR", "Winner must be one of the compared products");
  }

  await prisma.comparison.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(input.winnerProductId !== undefined ? { winnerProductId: input.winnerProductId } : {}),
      ...(input.methodology !== undefined ? { methodology: input.methodology } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
    },
  });

  await syncItems(existing.id, input.items);
  return getComparisonByIdOrSlug(existing.id, { isAdmin: true });
}

export async function deleteComparison(idOrSlug: string) {
  const existing = await findComparison(idOrSlug, { isAdmin: true });
  await prisma.comparison.delete({ where: { id: existing.id } });
  return { id: existing.id };
}

export async function listComparisonsForProduct(productId: string) {
  const comparisons = await prisma.comparison.findMany({
    where: {
      published: true,
      items: { some: { productId } },
    },
    include: comparisonInclude,
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return comparisons.map((item) => serializeComparison(item as never, { includeBody: false }));
}

export async function listSitemapComparisons() {
  return prisma.comparison.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
