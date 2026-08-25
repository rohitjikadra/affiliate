import { ProductSection } from "@/components/product/ProductSection";

export function AnalysisSection({ description }: { description?: string | null }) {
  const text = description?.trim();
  if (!text) {
    return null;
  }

  return (
    <ProductSection title="Why we recommend it">
      <p className="mt-3 max-w-3xl text-sm leading-7 text-ink">{text}</p>
    </ProductSection>
  );
}
