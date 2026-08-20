import { prisma } from "../../config/prisma.js";
import { AppError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";
import type { CreateMerchantInput, UpdateMerchantInput } from "./merchant.schemas.js";

function serializeMerchant(
  merchant: {
    id: string;
    slug: string;
    name: string;
    websiteUrl: string | null;
    kind: string;
    logoUrl: string | null;
    isActive: boolean;
    network: string | null;
    defaultTag: string | null;
    disclosure: string | null;
    _count?: { offers: number };
  },
  options: { includeTag?: boolean } = {},
) {
  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    websiteUrl: merchant.websiteUrl,
    kind: merchant.kind,
    logoUrl: merchant.logoUrl,
    isActive: merchant.isActive,
    network: merchant.network,
    defaultTag: options.includeTag ? merchant.defaultTag : null,
    disclosure: merchant.disclosure,
    offerCount: merchant._count?.offers ?? undefined,
  };
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const existing = await prisma.merchant.findUnique({ where: { slug }, select: { id: true } });
  if (!existing || existing.id === excludeId) {
    return slug;
  }
  if (excludeId) {
    throw new AppError(409, "CONFLICT", "Slug is already in use");
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export async function listMerchants(options: { includeInactive?: boolean; includeTag?: boolean } = {}) {
  const merchants = await prisma.merchant.findMany({
    where: options.includeInactive ? {} : { isActive: true },
    include: { _count: { select: { offers: true } } },
    orderBy: { name: "asc" },
  });
  return merchants.map((merchant) => serializeMerchant(merchant, { includeTag: options.includeTag }));
}

export async function getMerchant(idOrSlug: string, options: { includeTag?: boolean } = {}) {
  const merchant = await prisma.merchant.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: { _count: { select: { offers: true } } },
  });
  if (!merchant) {
    throw new AppError(404, "NOT_FOUND", "Merchant not found");
  }
  return serializeMerchant(merchant, options);
}

export async function createMerchant(input: CreateMerchantInput) {
  const slug = await ensureUniqueSlug(input.slug ?? slugify(input.name));
  const merchant = await prisma.merchant.create({
    data: {
      name: input.name,
      slug,
      websiteUrl: input.websiteUrl,
      kind: input.kind,
      logoUrl: input.logoUrl,
      isActive: input.isActive,
      network: input.network,
      defaultTag: input.defaultTag,
      disclosure: input.disclosure,
    },
    include: { _count: { select: { offers: true } } },
  });
  return serializeMerchant(merchant, { includeTag: true });
}

export async function updateMerchant(id: string, input: UpdateMerchantInput) {
  await getMerchant(id, { includeTag: true });
  const slug = input.slug ? await ensureUniqueSlug(input.slug, id) : undefined;
  const merchant = await prisma.merchant.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.websiteUrl !== undefined ? { websiteUrl: input.websiteUrl } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.network !== undefined ? { network: input.network } : {}),
      ...(input.defaultTag !== undefined ? { defaultTag: input.defaultTag } : {}),
      ...(input.disclosure !== undefined ? { disclosure: input.disclosure } : {}),
    },
    include: { _count: { select: { offers: true } } },
  });
  return serializeMerchant(merchant, { includeTag: true });
}

export async function deleteMerchant(id: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { _count: { select: { offers: true } } },
  });
  if (!merchant) {
    throw new AppError(404, "NOT_FOUND", "Merchant not found");
  }
  if (merchant._count.offers > 0) {
    throw new AppError(409, "CONFLICT", "Remove this merchant's offers first.");
  }
  await prisma.merchant.delete({ where: { id } });
  return { id };
}
