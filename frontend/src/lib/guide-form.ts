import type { GuidePayload } from "@/types/guide";
import { slugifyTitle } from "@/lib/slug";

export type GuideFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  kind: import("@/types/product").GuideKind;
  published: boolean;
  methodology: string;
  seoTitle: string;
  seoDescription: string;
  categoryId: string;
  relatedProductIds: string;
};

export { slugifyTitle };

export function validateGuideForm(values: GuideFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  } else if (values.title.trim().length > 200) {
    errors.title = "Title must be 200 characters or less";
  }

  if (values.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    errors.slug = "Use lowercase letters, numbers, and hyphens";
  }

  if (values.excerpt.trim().length > 500) {
    errors.excerpt = "Excerpt must be 500 characters or less";
  }

  if (!values.body.trim()) {
    errors.body = "Body is required";
  } else if (values.body.trim().length > 50000) {
    errors.body = "Body must be 50,000 characters or less";
  }

  return errors;
}

export function toGuidePayload(values: GuideFormValues): GuidePayload {
  return {
    title: values.title.trim(),
    slug: values.slug.trim() || undefined,
    excerpt: values.excerpt.trim() || null,
    body: values.body.trim(),
    kind: values.kind,
    published: values.published,
    methodology: values.methodology.trim() || null,
    seoTitle: values.seoTitle.trim() || null,
    seoDescription: values.seoDescription.trim() || null,
    categoryId: values.categoryId || null,
    products: values.relatedProductIds
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .map((productId, index) => ({ productId, rank: index + 1, badge: index === 0 ? "BEST_OVERALL" : "RELATED" as const })),
  };
}
