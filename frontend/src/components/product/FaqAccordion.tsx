import type { FaqPair } from "@/lib/text";
import { ProductSection } from "@/components/product/ProductSection";

export function FaqAccordion({ items }: { items: FaqPair[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ProductSection title="FAQ">
      <div className="mt-3 divide-y divide-line">
        {items.map((item) => (
          <details key={item.question} className="group py-3">
            <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                <span>{item.question}</span>
                <span className="mt-0.5 text-ink-subtle group-open:hidden" aria-hidden>
                  +
                </span>
                <span className="mt-0.5 hidden text-ink-subtle group-open:inline" aria-hidden>
                  −
                </span>
              </span>
            </summary>
            <p className="mt-2 max-w-3xl pr-8 text-sm leading-7 text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </ProductSection>
  );
}
