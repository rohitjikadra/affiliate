import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { normalizePagination, paginationMeta } from "../../lib/pagination.js";
import { slugify } from "../../lib/slug.js";
import { findSlugRedirect, recordSlugChange } from "../../lib/slug-redirect.js";
import { productInclude } from "../products/product.service.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CreateGuideInput, ListGuidesQuery, UpdateGuideInput } from "./guide.schemas.js";
import { serializeGuide } from "./guide.serializer.js";

const guideInclude = {
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  products: {
    include: {
      product: {
        include: productInclude as Prisma.ProductInclude,
      },
    },
    orderBy: { rank: "asc" as const },
  },
} as Prisma.GuideInclude;

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const existing = await prisma.guide.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!existing || existing.id === excludeId) {
    return slug;
  }

  if (excludeId) {
    throw new AppError(409, "CONFLICT", "Slug is already in use");
  }

  return `${slug}-${Date.now().toString(36)}`;
}

async function assertCategoryExists(categoryId?: string | null): Promise<void> {
  if (!categoryId) {
    return;
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError(400, "VALIDATION_ERROR", "Selected category does not exist");
  }
}

async function syncGuideProducts(
  guideId: string,
  products: CreateGuideInput["products"],
): Promise<void> {
  if (products === undefined) {
    return;
  }

  const ids = products.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Duplicate products are not allowed");
  }

  if (ids.length > 0) {
    const count = await prisma.product.count({ where: { id: { in: ids } } });
    if (count !== ids.length) {
      throw new AppError(400, "VALIDATION_ERROR", "One or more products do not exist");
    }
  }

  await prisma.$transaction([
    prisma.guideProduct.deleteMany({ where: { guideId } }),
    ...(products.length
      ? [
          prisma.guideProduct.createMany({
            data: products.map((item, index) => ({
              guideId,
              productId: item.productId,
              rank: item.rank ?? index + 1,
              badge: item.badge ?? "RELATED",
              notes: item.notes ?? null,
            })),
          }),
        ]
      : []),
  ]);
}

async function findGuide(idOrSlug: string, options: { isAdmin?: boolean } = {}) {
  const guide = await prisma.guide.findFirst({
    where: {
      OR: [{ slug: idOrSlug }, { id: idOrSlug }],
    },
    include: guideInclude,
  });

  if (!guide) {
    const toSlug = await findSlugRedirect("guide", idOrSlug);
    if (toSlug) {
      throw new AppError(308, "MOVED_PERMANENTLY", "This guide has moved", {
        toSlug,
        entityType: "guide",
      });
    }
    throw new AppError(404, "NOT_FOUND", "Guide not found");
  }

  if (!options.isAdmin && !guide.published) {
    throw new AppError(404, "NOT_FOUND", "Guide not found");
  }

  return guide;
}

export async function listGuides(
  query: ListGuidesQuery = {},
  options: { includeUnpublished?: boolean } = {},
) {
  const includeUnpublished = options.includeUnpublished ?? false;
  const { skip, take, page, limit } = normalizePagination(query);
  const where = {
    ...(includeUnpublished ? {} : { published: true }),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
  };

  const [guides, total] = await Promise.all([
    prisma.guide.findMany({
      where,
      include: guideInclude,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    prisma.guide.count({ where }),
  ]);

  return {
    items: guides.map((guide) => serializeGuide(guide as never, { includeBody: false })),
    meta: paginationMeta(total, page, limit),
  };
}

export async function getGuideByIdOrSlug(idOrSlug: string, options: { isAdmin?: boolean } = {}) {
  const guide = await findGuide(idOrSlug, options);
  return serializeGuide(guide as never, { includeBody: true });
}

export async function createGuide(input: CreateGuideInput) {
  await assertCategoryExists(input.categoryId);

  const slug = await ensureUniqueSlug(input.slug ?? slugify(input.title));

  const guide = await prisma.guide.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      body: input.body,
      kind: input.kind,
      published: input.published,
      methodology: input.methodology,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      categoryId: input.categoryId,
    },
    include: guideInclude,
  });

  await syncGuideProducts(guide.id, input.products);
  return getGuideByIdOrSlug(guide.id, { isAdmin: true });
}

export async function updateGuide(idOrSlug: string, input: UpdateGuideInput) {
  const existing = await findGuide(idOrSlug, { isAdmin: true });
  await assertCategoryExists(input.categoryId);

  const slug =
    input.slug !== undefined && input.slug !== existing.slug
      ? await ensureUniqueSlug(input.slug, existing.id)
      : undefined;

  if (slug) {
    await recordSlugChange("guide", existing.slug, slug);
  }

  await prisma.guide.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      ...(input.methodology !== undefined ? { methodology: input.methodology } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
  });

  await syncGuideProducts(existing.id, input.products);
  return getGuideByIdOrSlug(existing.id, { isAdmin: true });
}

export async function deleteGuide(idOrSlug: string) {
  const existing = await findGuide(idOrSlug, { isAdmin: true });
  await prisma.guide.delete({ where: { id: existing.id } });
  return { id: existing.id };
}

export async function listGuidesForProduct(productId: string) {
  const guides = await prisma.guide.findMany({
    where: {
      published: true,
      products: { some: { productId } },
    },
    include: guideInclude,
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  return guides.map((guide) => serializeGuide(guide as never, { includeBody: false }));
}
