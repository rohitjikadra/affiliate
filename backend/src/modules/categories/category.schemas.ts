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

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
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
  description: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable().optional()),
  imageUrl: z.preprocess(emptyToNull, httpUrl.nullable().optional()),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
