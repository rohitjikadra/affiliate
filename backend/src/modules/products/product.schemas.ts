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

const httpUrl = z.string().max(2000).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Enter a valid URL");

const optionalUrl = z.preprocess(emptyToNull, httpUrl.nullable().optional());

const optionalText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional());

const optionalAmount = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().finite().nonnegative().nullable().optional());

const optionalScore = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().min(0).max(10).nullable().optional());

export const productSourceSchema = z.enum(["MANUAL", "AMAZON", "FLIPKART"]);

const slugSchema = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
);

const specItemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(200),
});

const scoreBreakdownItemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  score: z.number().min(0).max(10),
});

const optionalSpecList = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  return value;
}, z.array(specItemSchema).max(20).nullable().optional());

const optionalScoreBreakdown = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  return value;
}, z.array(scoreBreakdownItemSchema).max(12).nullable().optional());

const optionalImageList = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  return value;
}, z.array(httpUrl).max(12).nullable().optional());

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema,
  description: optionalText(5000),
  pros: optionalText(4000),
  cons: optionalText(4000),
  bestFor: optionalText(500),
  faq: optionalText(8000),
  brand: optionalText(80),
  warranty: optionalText(160),
  specs: optionalSpecList,
  scoreBreakdown: optionalScoreBreakdown,
  imageUrl: optionalUrl,
  images: optionalImageList,
  price: optionalAmount,
  originalPrice: optionalAmount,
  ourScore: optionalScore,
  currency: z.string().trim().length(3, "Currency must be a 3-letter code").default("INR"),
  affiliateUrl: optionalUrl,
  source: productSourceSchema.default("MANUAL"),
  sourceId: optionalText(200),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  categoryId: z.preprocess(emptyToNull, z.string().min(1).nullable().optional()),
});

export const updateProductSchema = createProductSchema.partial();

export const productStatusSchema = z.object({
  isActive: z.boolean(),
});

export const productGoSchema = z.object({
  referrer: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
  landingPath: z.preprocess(blankToUndefined, z.string().trim().max(500).optional()),
  utmSource: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  utmMedium: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  utmCampaign: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
});

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

export const listProductsQuerySchema = z.object({
  q: z.preprocess(firstQueryValue, z.preprocess(blankToUndefined, z.string().trim().max(200).optional())),
  category: z.preprocess(
    firstQueryValue,
    z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  ),
  featured: queryBoolean,
  includeInactive: queryBoolean,
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

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductStatusInput = z.infer<typeof productStatusSchema>;
export type ProductGoInput = z.infer<typeof productGoSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
