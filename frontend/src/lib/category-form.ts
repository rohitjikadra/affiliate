import type { CategoryPayload } from "@/types/product";
import { isHttpUrl, slugifyTitle } from "@/lib/slug";

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
};

export { slugifyTitle };

export function validateCategoryForm(values: CategoryFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "Name is required";
  } else if (values.name.trim().length > 120) {
    errors.name = "Name must be 120 characters or less";
  }

  if (values.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    errors.slug = "Use lowercase letters, numbers, and hyphens";
  }

  if (values.description.trim().length > 1000) {
    errors.description = "Description must be 1000 characters or less";
  }

  if (values.imageUrl.trim() && !isHttpUrl(values.imageUrl.trim())) {
    errors.imageUrl = "Enter a valid image URL";
  }

  return errors;
}

export function toCategoryPayload(values: CategoryFormValues): CategoryPayload {
  return {
    name: values.name.trim(),
    slug: values.slug.trim() || undefined,
    description: values.description.trim() || null,
    imageUrl: values.imageUrl.trim() || null,
  };
}
