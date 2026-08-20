import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";
import { findSlugRedirect, recordSlugChange } from "../../lib/slug-redirect.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./category.schemas.js";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  imageUrl: true,
  _count: {
    select: {
      products: { where: { isActive: true } },
      guides: true,
    },
  },
} as const;

function serializeCategory(category: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  _count: { products: number; guides: number };
}) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    productCount: category._count.products,
    guideCount: category._count.guides,
  };
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const existing = await prisma.category.findUnique({
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

async function findCategory(idOrSlug: string) {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ slug: idOrSlug }, { id: idOrSlug }],
    },
    select: categorySelect,
  });

  if (!category) {
    const toSlug = await findSlugRedirect("category", idOrSlug);
    if (toSlug) {
      throw new AppError(308, "MOVED_PERMANENTLY", "This category has moved", {
        toSlug,
        entityType: "category",
      });
    }
    throw new AppError(404, "NOT_FOUND", "Category not found");
  }

  return category;
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: categorySelect,
  });

  return categories.map(serializeCategory);
}

export async function getCategoryByIdOrSlug(idOrSlug: string) {
  return serializeCategory(await findCategory(idOrSlug));
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = await ensureUniqueSlug(input.slug ?? slugify(input.name));

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
    },
    select: categorySelect,
  });

  return serializeCategory(category);
}

export async function updateCategory(idOrSlug: string, input: UpdateCategoryInput) {
  const existing = await findCategory(idOrSlug);

  const slug =
    input.slug !== undefined && input.slug !== existing.slug
      ? await ensureUniqueSlug(input.slug, existing.id)
      : undefined;

  if (slug) {
    await recordSlugChange("category", existing.slug, slug);
  }

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    },
    select: categorySelect,
  });

  return serializeCategory(category);
}

export async function deleteCategory(idOrSlug: string) {
  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ slug: idOrSlug }, { id: idOrSlug }],
    },
    select: {
      id: true,
      _count: {
        select: {
          products: true,
          guides: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Category not found");
  }

  if (existing._count.products > 0 || existing._count.guides > 0) {
    throw new AppError(
      409,
      "CONFLICT",
      "Move or delete products and guides in this category first.",
    );
  }

  await prisma.category.delete({ where: { id: existing.id } });
  return { id: existing.id };
}
