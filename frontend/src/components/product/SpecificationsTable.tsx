import type { SpecItem } from "@/types/product";
import { ProductSection } from "@/components/product/ProductSection";

export function SpecificationsTable({ specs }: { specs: SpecItem[] }) {
  const items = specs.filter((item) => item.label?.trim() && item.value?.trim());
  if (items.length === 0) {
    return null;
  }

  return (
    <ProductSection title="Specifications">
      <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
            <dt className="text-ink-muted">{item.label}</dt>
            <dd className="text-right font-medium text-ink">{item.value}</dd>
          </div>
        ))}
      </dl>
    </ProductSection>
  );
}
