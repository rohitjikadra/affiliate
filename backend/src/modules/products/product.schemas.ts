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

const httpUrl = z
  .string()
  .max(2000)
  .refine((value) => {
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

const optionalRating = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().min(0).max(5).nullable().optional());

export const productSourceSchema = z.enum(["MANUAL", "AMAZON", "FLIPKART"]);

export const createProductSchema = z.object({
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
  description: optionalText(5000),
  imageUrl: optionalUrl,
  price: z.coerce.number().finite().nonnegative("Price cannot be negative"),
  originalPrice: optionalAmount,
  rating: optionalRating,
  currency: z.string().trim().length(3, "Currency must be a 3-letter code").default("INR"),
  affiliateUrl: optionalUrl,
  source: productSourceSchema.default("MANUAL"),
  sourceId: optionalText(200),
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
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductStatusInput = z.infer<typeof productStatusSchema>;
export type ProductGoInput = z.infer<typeof productGoSchema>;
