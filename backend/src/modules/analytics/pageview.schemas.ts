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

export const createPageViewSchema = z.object({
  path: z.string().trim().min(1).max(500),
  entityType: z.preprocess(blankToUndefined, z.enum(["product", "guide", "comparison", "category", "best"]).optional()),
  entityId: z.preprocess(blankToUndefined, z.string().trim().max(80).optional()),
  referrer: z.preprocess(blankToUndefined, z.string().trim().max(2000).optional()),
  utmSource: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  utmMedium: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  utmCampaign: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
});

export type CreatePageViewInput = z.infer<typeof createPageViewSchema>;
