import { prisma } from "../../config/prisma.js";

export async function listSitemapEntities() {
  const [products, categories, guides, comparisons] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.guide.findMany({
      where: { published: true },
      select: { slug: true, kind: true, updatedAt: true },
    }),
    prisma.comparison.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return { products, categories, guides, comparisons };
}
