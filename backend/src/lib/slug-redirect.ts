import { prisma } from "../config/prisma.js";

export type SlugEntityType = "product" | "category" | "guide" | "comparison";

export async function recordSlugChange(
  entityType: SlugEntityType,
  fromSlug: string,
  toSlug: string,
): Promise<void> {
  if (fromSlug === toSlug) {
    return;
  }

  await prisma.$transaction([
    prisma.slugRedirect.upsert({
      where: {
        entityType_fromSlug: { entityType, fromSlug },
      },
      create: { entityType, fromSlug, toSlug },
      update: { toSlug },
    }),
    prisma.slugRedirect.updateMany({
      where: { entityType, toSlug: fromSlug },
      data: { toSlug },
    }),
    prisma.slugRedirect.deleteMany({
      where: { entityType, fromSlug: toSlug },
    }),
  ]);
}

export async function findSlugRedirect(
  entityType: SlugEntityType,
  fromSlug: string,
): Promise<string | null> {
  const redirect = await prisma.slugRedirect.findUnique({
    where: { entityType_fromSlug: { entityType, fromSlug } },
    select: { toSlug: true },
  });

  return redirect?.toSlug ?? null;
}
