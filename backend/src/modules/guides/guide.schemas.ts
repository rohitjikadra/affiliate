import { z } from "zod";

const blankToUndefined = (value: unknown) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const emptyToNull = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  return value;
};

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const firstQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const queryBoolean = z.preprocess((value) => {
  const raw = firstQueryValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }
  if (raw === "true" || raw === true) {
    return true;
  }
  if (raw === "false" || raw === false) {
    return false;
  }
  return raw;
}, z.boolean().optional());

const queryNumber = z.preprocess((value) => {
  const raw = firstQueryValue(value);
  if (raw === undefined || raw === "") {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
}, z.number().int().min(1).optional());

export const guideKindSchema = z.enum(["ARTICLE", "BEST_OF"]);
export const guideProductBadgeSchema = z.enum([
  "BEST_OVERALL",
  "BEST_BUDGET",
  "BEST_PREMIUM",
  "BEST_FOR_BEGINNERS",
  "RELATED",
]);

export const guideProductInputSchema = z.object({
  productId: z.string().min(1),
  rank: z.number().int().min(1).max(50).nullable().optional(),
  badge: guideProductBadgeSchema.optional(),
  notes: optionalText(1000),
});

export const createGuideSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens")
      .optional(),
  ),
  excerpt: optionalText(500),
  body: z.string().trim().min(1, "Body is required").max(50000),
  kind: guideKindSchema.default("ARTICLE"),
  published: z.boolean().default(false),
  methodology: optionalText(8000),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  categoryId: z.preprocess(emptyToNull, z.string().min(1).nullable().optional()),
  products: z.array(guideProductInputSchema).max(30).optional(),
});

export const updateGuideSchema = createGuideSchema.partial();

export const listGuidesQuerySchema = z.object({
  includeUnpublished: queryBoolean,
  category: z.preprocess(
    firstQueryValue,
    z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  ),
  kind: z.preprocess(firstQueryValue, guideKindSchema.optional()),
  page: queryNumber,
  limit: z.preprocess((value) => {
    const raw = firstQueryValue(value);
    if (raw === undefined || raw === "") {
      return undefined;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }, z.number().int().min(1).max(100).optional()),
});

export type CreateGuideInput = z.infer<typeof createGuideSchema>;
export type UpdateGuideInput = z.infer<typeof updateGuideSchema>;
export type ListGuidesQuery = z.infer<typeof listGuidesQuerySchema>;
