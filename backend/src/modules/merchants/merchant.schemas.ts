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

export const merchantKindSchema = z.enum(["MARKETPLACE", "DIRECT", "NETWORK"]);

export const createMerchantSchema = z.object({
  name: z.string().trim().min(1).max(120),
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
  websiteUrl: z.preprocess(emptyToNull, httpUrl.nullable().optional()),
  kind: merchantKindSchema.default("MARKETPLACE"),
  logoUrl: z.preprocess(emptyToNull, httpUrl.nullable().optional()),
  isActive: z.boolean().default(true),
  network: z.preprocess(emptyToNull, z.string().trim().max(50).nullable().optional()),
  defaultTag: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  disclosure: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional()),
});

export const updateMerchantSchema = createMerchantSchema.partial();

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;
