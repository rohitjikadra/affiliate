import { ProductSection } from "@/components/product/ProductSection";
import { splitLines } from "@/lib/text";

export function WhoShouldAvoid({ whoShouldAvoid }: { whoShouldAvoid?: string | null }) {
  const items = splitLines(whoShouldAvoid);
  if (items.length === 0) {
    return null;
  }

  return (
    <ProductSection title="You may want another option if">
      {items.length === 1 ? (
        <p className="mt-3 text-sm leading-7 text-ink-muted">{items[0]}</p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-muted">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </ProductSection>
  );
}
