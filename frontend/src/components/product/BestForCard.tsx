import { ProductSection } from "@/components/product/ProductSection";
import { splitLines } from "@/lib/text";

export function BestForCard({ bestFor }: { bestFor?: string | null }) {
  const items = splitLines(bestFor);
  if (items.length < 2) {
    return null;
  }

  return (
    <ProductSection title="Best for">
      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-0.5 text-forest" aria-hidden>
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ProductSection>
  );
}
