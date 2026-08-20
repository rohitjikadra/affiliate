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

const firstQueryValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

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

export const comparisonItemSchema = z.object({
  productId: z.string().min(1),
  sortOrder: z.number().int().min(0).max(50).optional(),
  notes: optionalText(2000),
});

export const createComparisonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
  ),
  excerpt: optionalText(500),
  body: z.string().trim().min(1).max(50000),
  published: z.boolean().default(false),
  winnerProductId: z.preprocess(emptyToNull, z.string().min(1).nullable().optional()),
  methodology: optionalText(8000),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  items: z.array(comparisonItemSchema).min(2).max(8),
});

export const updateComparisonSchema = createComparisonSchema.partial();

export const listComparisonsQuerySchema = z.object({
  includeUnpublished: queryBoolean,
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

export type CreateComparisonInput = z.infer<typeof createComparisonSchema>;
export type UpdateComparisonInput = z.infer<typeof updateComparisonSchema>;
export type ListComparisonsQuery = z.infer<typeof listComparisonsQuerySchema>;
