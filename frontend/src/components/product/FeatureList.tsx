import { ProductSection } from "@/components/product/ProductSection";

export function FeatureList({ features }: { features: string[] }) {
  if (features.length === 0) {
    return null;
  }

  return (
    <ProductSection title="Features">
      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
        {features.map((item) => (
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
