import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";
import type {
  CreateProductInput,
  ListProductsQuery,
  ProductStatusInput,
  UpdateProductInput,
} from "./product.schemas.js";
import { serializeProduct } from "./product.serializer.js";

const productInclude = {
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} as const;

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const existing = await prisma.product.findUnique({
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

export async function listProducts(query: ListProductsQuery = {}) {
  const products = await prisma.product.findMany({
    where: {
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.featured ? { featured: true } : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return products.map((product) => serializeProduct(product, { includeAffiliateUrl: false }));
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return serializeProduct(product);
}

export async function getProductByIdOrSlug(idOrSlug: string) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug: idOrSlug }, { id: idOrSlug }],
    },
    include: productInclude,
  });

  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return serializeProduct(product);
}

export async function createProduct(input: CreateProductInput) {
  await assertCategoryExists(input.categoryId);

  const slug = await ensureUniqueSlug(input.slug ?? slugify(input.title));

  const product = await prisma.product.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      price: input.price,
      originalPrice: input.originalPrice,
      rating: input.rating,
      currency: input.currency,
      affiliateUrl: input.affiliateUrl,
      source: input.source,
      sourceId: input.sourceId,
      featured: input.featured,
      isActive: input.isActive,
      categoryId: input.categoryId,
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id);
  await assertCategoryExists(input.categoryId);

  const slug =
    input.slug !== undefined
      ? await ensureUniqueSlug(input.slug, id)
      : input.title
        ? await ensureUniqueSlug(slugify(input.title), id)
        : undefined;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: input.affiliateUrl } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.sourceId !== undefined ? { sourceId: input.sourceId } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function setProductStatus(id: string, input: ProductStatusInput) {
  await getProductById(id);

  const product = await prisma.product.update({
    where: { id },
    data: { isActive: input.isActive },
    include: productInclude,
  });

  return serializeProduct(product);
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  await prisma.product.delete({ where: { id } });
  return { id };
}
