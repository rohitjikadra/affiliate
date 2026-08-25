import type { Product } from "@/types/product";

export function compareColumnLabel(product: Product): string {
  if (product.brand && product.modelNumber) {
    return `${product.brand} ${product.modelNumber}`;
  }
  const words = product.title.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
  return words.slice(0, 4).join(" ");
}

export function vsHeadline(products: Product[]): string {
  return products.map(compareColumnLabel).join(" vs ");
}

export function ourScoreValue(product: Product): number | null {
  if (product.ourScore == null || product.ourScore === "") {
    return null;
  }
  const value = Number(product.ourScore);
  return Number.isFinite(value) ? value : null;
}

export function comparisonSpecLabels(products: Product[]): string[] {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    for (const spec of product.specs ?? []) {
      const label = spec.label.trim();
      if (!label || seen.has(label)) {
        continue;
      }
      seen.add(label);
      labels.push(label);
    }
  }
  return labels;
}

export function specValueFor(product: Product, label: string): string | null {
  const match = product.specs?.find((spec) => spec.label.trim() === label);
  const value = match?.value?.trim();
  return value ? value : null;
}
