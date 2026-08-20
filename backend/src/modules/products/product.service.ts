import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { normalizePagination, paginationMeta } from "../../lib/pagination.js";
import { slugify } from "../../lib/slug.js";
import { findSlugRedirect, recordSlugChange } from "../../lib/slug-redirect.js";
import { Prisma } from "../../generated/prisma/client.js";
import type {
  CreateProductInput,
  ListProductsQuery,
  ProductStatusInput,
  UpdateProductInput,
} from "./product.schemas.js";
import { serializeProduct } from "./product.serializer.js";

function imageFields(input: { images?: string[] | null; imageUrl?: string | null }) {
  const images = input.images && input.images.length > 0 ? input.images : input.imageUrl ? [input.imageUrl] : null;
  return {
    images: images === null ? Prisma.JsonNull : images,
    imageUrl: images?.[0] ?? null,
  };
}

export const productInclude = {
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  offers: {
    where: { merchant: { isActive: true } },
    include: {
      merchant: {
        select: {
          id: true,
          slug: true,
          name: true,
          kind: true,
          network: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ isPrimary: "desc" as const }, { updatedAt: "desc" as const }],
  },
} satisfies Prisma.ProductInclude;

const adminProductInclude = {
  category: productInclude.category,
  offers: {
    include: productInclude.offers.include,
    orderBy: productInclude.offers.orderBy,
  },
} satisfies Prisma.ProductInclude;

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

function adminSerializeOptions(includeAffiliateUrl: boolean, includeClickCount = false) {
  return { includeAffiliateUrl, includeClickCount };
}

export async function listProducts(
  query: ListProductsQuery = {},
  options: { includeAffiliateUrl?: boolean; includeClickCount?: boolean; includeInactiveOffers?: boolean } = {},
) {
  const includeClickCount = options.includeClickCount ?? false;
  const includeAffiliateUrl = options.includeAffiliateUrl ?? false;
  const { skip, take, page, limit } = normalizePagination(query);
  const where = {
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(query.featured ? { featured: true } : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { description: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        ...(includeAffiliateUrl ? adminProductInclude : productInclude),
        ...(includeClickCount ? { _count: { select: { clicks: true } } } : {}),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map((product) =>
      serializeProduct(product as never, adminSerializeOptions(includeAffiliateUrl, includeClickCount)),
    ),
    meta: paginationMeta(total, page, limit),
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: adminProductInclude,
  });

  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return serializeProduct(product as never, { includeAffiliateUrl: true });
}

export async function getProductByIdOrSlug(
  idOrSlug: string,
  options: { isAdmin?: boolean; includeAffiliateUrl?: boolean } = {},
) {
  const includeAffiliateUrl = options.includeAffiliateUrl ?? false;
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug: idOrSlug }, { id: idOrSlug }],
    },
    include: includeAffiliateUrl ? adminProductInclude : productInclude,
  });

  if (!product) {
    const toSlug = await findSlugRedirect("product", idOrSlug);
    if (toSlug) {
      throw new AppError(308, "MOVED_PERMANENTLY", "This product has moved", {
        toSlug,
        entityType: "product",
      });
    }
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  if (!options.isAdmin && !product.isActive) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return serializeProduct(product as never, { includeAffiliateUrl });
}

export async function createProduct(input: CreateProductInput) {
  await assertCategoryExists(input.categoryId);

  const slug = await ensureUniqueSlug(input.slug ?? slugify(input.title));

  const product = await prisma.product.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      pros: input.pros,
      cons: input.cons,
      bestFor: input.bestFor,
      faq: input.faq,
      brand: input.brand,
      warranty: input.warranty,
      specs: input.specs === undefined ? undefined : input.specs === null ? Prisma.JsonNull : input.specs,
      scoreBreakdown:
        input.scoreBreakdown === undefined
          ? undefined
          : input.scoreBreakdown === null
            ? Prisma.JsonNull
            : input.scoreBreakdown,
      ...imageFields(input),
      price: input.price ?? null,
      originalPrice: input.originalPrice,
      ourScore: input.ourScore,
      currency: input.currency,
      affiliateUrl: input.affiliateUrl,
      source: input.source,
      sourceId: input.sourceId,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      featured: input.featured,
      isActive: input.isActive,
      categoryId: input.categoryId,
    },
    include: adminProductInclude,
  });

  return serializeProduct(product as never, { includeAffiliateUrl: true });
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  await assertCategoryExists(input.categoryId);

  const slug =
    input.slug !== undefined && input.slug !== existing.slug
      ? await ensureUniqueSlug(input.slug, id)
      : undefined;

  if (slug) {
    await recordSlugChange("product", existing.slug, slug);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.pros !== undefined ? { pros: input.pros } : {}),
      ...(input.cons !== undefined ? { cons: input.cons } : {}),
      ...(input.bestFor !== undefined ? { bestFor: input.bestFor } : {}),
      ...(input.faq !== undefined ? { faq: input.faq } : {}),
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(input.warranty !== undefined ? { warranty: input.warranty } : {}),
      ...(input.specs !== undefined ? { specs: input.specs === null ? Prisma.JsonNull : input.specs } : {}),
      ...(input.scoreBreakdown !== undefined
        ? { scoreBreakdown: input.scoreBreakdown === null ? Prisma.JsonNull : input.scoreBreakdown }
        : {}),
      ...(input.images !== undefined || input.imageUrl !== undefined
        ? imageFields({
            images: input.images,
            imageUrl: input.imageUrl,
          })
        : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
      ...(input.ourScore !== undefined ? { ourScore: input.ourScore } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.affiliateUrl !== undefined ? { affiliateUrl: input.affiliateUrl } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.sourceId !== undefined ? { sourceId: input.sourceId } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    },
    include: adminProductInclude,
  });

  return serializeProduct(product as never, { includeAffiliateUrl: true });
}

export async function setProductStatus(id: string, input: ProductStatusInput) {
  await getProductById(id);

  const product = await prisma.product.update({
    where: { id },
    data: { isActive: input.isActive },
    include: adminProductInclude,
  });

  return serializeProduct(product as never, { includeAffiliateUrl: true });
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  await prisma.product.delete({ where: { id } });
  return { id };
}

export async function listRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: productInclude,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return products.map((product) => serializeProduct(product as never, { includeAffiliateUrl: false }));
}
