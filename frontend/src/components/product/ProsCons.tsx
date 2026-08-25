import { ProductSection } from "@/components/product/ProductSection";

type ProsConsProps = {
  pros: string[];
  cons: string[];
};

export function ProsCons({ pros, cons }: ProsConsProps) {
  if (pros.length === 0 && cons.length === 0) {
    return null;
  }

  return (
    <div className={`mt-6 grid gap-4 ${pros.length > 0 && cons.length > 0 ? "sm:grid-cols-2" : ""}`}>
      {pros.length > 0 ? (
        <ProductSection title="Pros" className="mt-0">
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
            {pros.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-forest" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ProductSection>
      ) : null}
      {cons.length > 0 ? (
        <ProductSection title="Cons" className="mt-0">
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
            {cons.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-ink-muted" aria-hidden>
                  ×
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </ProductSection>
      ) : null}
    </div>
  );
}
