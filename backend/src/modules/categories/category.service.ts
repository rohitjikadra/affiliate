import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";

const categorySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  imageUrl: true,
  _count: {
    select: {
      products: {
        where: { isActive: true },
      },
    },
  },
} as const;

function serializeCategory(
  category: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    _count: { products: number };
  },
) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    productCount: category._count.products,
  };
}

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: categorySelect,
  });

  return categories.map(serializeCategory);
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: categorySelect,
  });

  if (!category) {
    throw new AppError(404, "NOT_FOUND", "Category not found");
  }

  return serializeCategory(category);
}
