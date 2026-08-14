import type { ProductPayload, ProductSource } from "@/types/product";

export type ProductFormValues = {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  price: string;
  originalPrice: string;
  rating: string;
  currency: string;
  affiliateUrl: string;
  source: ProductSource;
  sourceId: string;
  featured: boolean;
  isActive: boolean;
  categoryId: string;
};

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProductForm(values: ProductFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) {
    errors.title = "Title is required";
  } else if (values.title.trim().length > 200) {
    errors.title = "Title must be 200 characters or less";
  }

  if (values.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    errors.slug = "Use lowercase letters, numbers, and hyphens";
  }

  const price = Number(values.price);
  if (values.price.trim() === "" || Number.isNaN(price)) {
    errors.price = "Price is required";
  } else if (price < 0) {
    errors.price = "Price cannot be negative";
  }

  if (values.originalPrice.trim()) {
    const originalPrice = Number(values.originalPrice);
    if (Number.isNaN(originalPrice) || originalPrice < 0) {
      errors.originalPrice = "Enter a valid original price";
    }
  }

  if (values.rating.trim()) {
    const rating = Number(values.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      errors.rating = "Rating must be between 0 and 5";
    }
  }

  if (!values.currency.trim() || values.currency.trim().length !== 3) {
    errors.currency = "Use a 3-letter currency code";
  }

  if (values.imageUrl.trim() && !isHttpUrl(values.imageUrl.trim())) {
    errors.imageUrl = "Enter a valid image URL";
  }

  if (values.affiliateUrl.trim() && !isHttpUrl(values.affiliateUrl.trim())) {
    errors.affiliateUrl = "Enter a valid affiliate URL";
  }

  return errors;
}

export function toProductPayload(values: ProductFormValues): ProductPayload {
  return {
    title: values.title.trim(),
    slug: values.slug.trim() || undefined,
    description: values.description.trim() || null,
    imageUrl: values.imageUrl.trim() || null,
    price: Number(values.price),
    originalPrice: values.originalPrice.trim() ? Number(values.originalPrice) : null,
    rating: values.rating.trim() ? Number(values.rating) : null,
    currency: values.currency.trim().toUpperCase(),
    affiliateUrl: values.affiliateUrl.trim() || null,
    source: values.source,
    sourceId: values.sourceId.trim() || null,
    featured: values.featured,
    isActive: values.isActive,
    categoryId: values.categoryId || null,
  };
}
