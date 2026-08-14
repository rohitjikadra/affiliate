import { prisma } from "../../config/prisma.js";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
    },
  });
}
