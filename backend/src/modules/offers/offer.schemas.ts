import { z } from "zod";

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

export const createOfferSchema = z.object({
  merchantId: z.string().min(1),
  title: z.preprocess(emptyToNull, z.string().trim().max(200).nullable().optional()),
  price: optionalAmount,
  originalPrice: optionalAmount,
  currency: z.string().trim().length(3).default("INR"),
  affiliateUrl: httpUrl,
  externalId: z.preprocess(emptyToNull, z.string().trim().max(200).nullable().optional()),
  inStock: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
});

export const updateOfferSchema = createOfferSchema.partial();

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
