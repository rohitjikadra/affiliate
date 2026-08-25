import type { ProductPayload, ProductSource, ProductStatus, ScoreBreakdownItem, SpecItem } from "@/types/product";
import { isHttpUrl, slugifyTitle } from "@/lib/slug";

export type ProductFormValues = {
  title: string;
  slug: string;
  description: string;
  features: string;
  pros: string;
  cons: string;
  bestFor: string;
  faq: string;
  brand: string;
  modelNumber: string;
  whoShouldAvoid: string;
  warranty: string;
  specs: string;
  scoreBreakdown: string;
  images: string;
  price: string;
  originalPrice: string;
  ourScore: string;
  currency: string;
  affiliateUrl: string;
  source: ProductSource;
  sourceId: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  isActive: boolean;
  status: ProductStatus;
  categoryId: string;
};

export { slugifyTitle };

export function imageUrlsToText(images: string[] | null | undefined, fallback?: string | null): string {
  const urls = images && images.length > 0 ? images : fallback ? [fallback] : [];
  return urls.join("\n");
}

export function textToImageUrls(text: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const line of text.split("\n")) {
    const url = line.trim();
    if (!url || seen.has(url) || urls.length >= 12) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function specsToText(specs: SpecItem[] | null | undefined): string {
  return (specs ?? []).map((item) => `${item.label}: ${item.value}`).join("\n");
}

export function textToSpecs(text: string): SpecItem[] {
  return text.split("\n").flatMap((line) => {
    const index = line.indexOf(":");
    if (index <= 0) {
      return [];
    }
    const label = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    return label && value ? [{ label, value }] : [];
  });
}

export function scoreBreakdownToText(items: ScoreBreakdownItem[] | null | undefined): string {
  return (items ?? []).map((item) => `${item.label}: ${item.score}`).join("\n");
}

export function textToScoreBreakdown(text: string): ScoreBreakdownItem[] {
  return text.split("\n").flatMap((line) => {
    const index = line.indexOf(":");
    if (index <= 0) {
      return [];
    }
    const label = line.slice(0, index).trim();
    const score = Number(line.slice(index + 1).trim());
    return label && Number.isFinite(score) && score >= 0 && score <= 10 ? [{ label, score }] : [];
  });
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

  if (values.price.trim()) {
    const price = Number(values.price);
    if (Number.isNaN(price) || price < 0) {
      errors.price = "Enter a valid price, or leave blank";
    }
  }

  if (values.originalPrice.trim()) {
    const originalPrice = Number(values.originalPrice);
    if (Number.isNaN(originalPrice) || originalPrice < 0) {
      errors.originalPrice = "Enter a valid original price";
    }
  }

  if (values.ourScore.trim()) {
    const score = Number(values.ourScore);
    if (Number.isNaN(score) || score < 0 || score > 10) {
      errors.ourScore = "Our Score must be between 0 and 10";
    }
  }

  if (!values.currency.trim() || values.currency.trim().length !== 3) {
    errors.currency = "Use a 3-letter currency code";
  }

  if (values.images.trim()) {
    const urls = textToImageUrls(values.images);
    const lines = values.images.split("\n").map((line) => line.trim()).filter(Boolean);
    if (urls.length === 0 || urls.length !== lines.length || urls.some((url) => !isHttpUrl(url))) {
      errors.images = "Use one https image URL per line, up to 12";
    }
  }

  if (values.affiliateUrl.trim() && !isHttpUrl(values.affiliateUrl.trim())) {
    errors.affiliateUrl = "Enter a valid affiliate URL";
  }

  if (values.features.trim().length > 4000) {
    errors.features = "About this item must be 4000 characters or less";
  } else if (values.features.trim()) {
    const bullets = values.features.split("\n").map((line) => line.trim()).filter(Boolean);
    if (bullets.length > 12) {
      errors.features = "Use up to 12 bullets, one per line";
    }
  }

  if (values.pros.trim().length > 4000) {
    errors.pros = "Pros must be 4000 characters or less";
  }

  if (values.cons.trim().length > 4000) {
    errors.cons = "Cons must be 4000 characters or less";
  }

  if (values.specs.trim()) {
    const specs = textToSpecs(values.specs);
    if (specs.length === 0) {
      errors.specs = "Use one spec per line as Label: value";
    }
  }

  if (values.scoreBreakdown.trim()) {
    const breakdown = textToScoreBreakdown(values.scoreBreakdown);
    const lines = values.scoreBreakdown.split("\n").filter((line) => line.trim());
    if (breakdown.length === 0 || breakdown.length !== lines.length) {
      errors.scoreBreakdown = "Use one line per factor as Label: 8.0 (0–10)";
    }
  }

  return errors;
}

export function toProductPayload(values: ProductFormValues): ProductPayload {
  const images = textToImageUrls(values.images);
  return {
    title: values.title.trim(),
    slug: values.slug.trim() || undefined,
    description: values.description.trim() || null,
    features: values.features.trim() || null,
    pros: values.pros.trim() || null,
    cons: values.cons.trim() || null,
    bestFor: values.bestFor.trim() || null,
    faq: values.faq.trim() || null,
    brand: values.brand.trim() || null,
    modelNumber: values.modelNumber.trim() || null,
    whoShouldAvoid: values.whoShouldAvoid.trim() || null,
    warranty: values.warranty.trim() || null,
    specs: textToSpecs(values.specs),
    scoreBreakdown: textToScoreBreakdown(values.scoreBreakdown),
    images,
    imageUrl: images[0] ?? null,
    price: values.price.trim() ? Number(values.price) : null,
    originalPrice: values.originalPrice.trim() ? Number(values.originalPrice) : null,
    ourScore: values.ourScore.trim() ? Number(values.ourScore) : null,
    currency: values.currency.trim().toUpperCase(),
    affiliateUrl: values.affiliateUrl.trim() || null,
    source: values.source,
    sourceId: values.sourceId.trim() || null,
    seoTitle: values.seoTitle.trim() || null,
    seoDescription: values.seoDescription.trim() || null,
    featured: values.featured,
    isActive: values.isActive,
    status: values.status,
    categoryId: values.categoryId || null,
  };
}
