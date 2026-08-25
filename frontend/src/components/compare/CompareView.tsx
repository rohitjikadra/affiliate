import Link from "next/link";
import { CompareProductSnapshot } from "@/components/compare/CompareProductSnapshot";
import { CompareStackedRows } from "@/components/compare/CompareStackedRows";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { GuideBody } from "@/components/guides/GuideBody";
import { ProductImage } from "@/components/media/ProductImage";
import {
  compareColumnLabel,
  comparisonSpecLabels,
  specValueFor,
  vsHeadline,
} from "@/lib/compare";
import { splitLines } from "@/lib/text";
import type { Comparison } from "@/types/comparison";
import type { Product } from "@/types/product";

function columnClass(count: number): string {
  if (count >= 3) {
    return "md:grid-cols-3";
  }
  if (count === 2) {
    return "md:grid-cols-2";
  }
  return "";
}

export function CompareView({ comparison }: { comparison: Comparison }) {
  const items = comparison.items;
  const products = items.map((item) => item.product);
  const labels = products.map(compareColumnLabel);
  const specLabels = comparisonSpecLabels(products);
  const winnerId = comparison.winnerProductId ?? comparison.winner?.id ?? null;
  const hasProsCons = products.some((product) => splitLines(product.pros).length > 0 || splitLines(product.cons).length > 0);
  const bestForRows = products.some((product) => product.bestFor?.trim())
    ? [{ label: "Best for", values: products.map((product) => product.bestFor?.trim() ?? null) }]
    : [];
  const avoidRows = products.some((product) => product.whoShouldAvoid?.trim())
    ? [{ label: "Who should avoid", values: products.map((product) => product.whoShouldAvoid?.trim() ?? null) }]
    : [];
  const specRows = specLabels.map((label) => ({
    label,
    values: products.map((product) => specValueFor(product, label)),
  }));
  const body = comparison.body?.trim() ?? "";
  const count = products.length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="product-section mt-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Compare</p>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-4xl">{comparison.title}</h1>
        {comparison.excerpt ? <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-muted sm:text-base">{comparison.excerpt}</p> : null}
        <p className="font-display mt-5 text-base font-semibold leading-snug text-ink sm:text-lg">{vsHeadline(products)}</p>
        <div className={`mt-4 grid gap-3 ${count >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {products.map((product) => (
            <VsThumb key={product.id} product={product} isWinner={product.id === winnerId} />
          ))}
        </div>
      </header>

      {comparison.winner ? (
        <section className="rounded-md border border-line bg-forest-soft px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest">Winner / recommendation</p>
          <p className="mt-2 text-sm leading-6 text-ink">
            Our pick:{" "}
            <Link href={`/products/${comparison.winner.slug}`} className="font-semibold text-forest underline">
              {comparison.winner.title}
            </Link>
          </p>
        </section>
      ) : null}

      {comparison.methodology ? (
        <section className="product-section mt-0">
          <h2 className="product-section-title">Methodology</h2>
          <p className="mt-3 text-sm leading-7 text-ink">{comparison.methodology}</p>
        </section>
      ) : null}

      <section>
        <h2 className="product-section-title mb-4">The products</h2>
        <div className={`grid gap-4 ${columnClass(count)}`}>
          {items.map((item) => (
            <CompareProductSnapshot
              key={item.id}
              product={item.product}
              notes={item.notes}
              isWinner={item.product.id === winnerId}
            />
          ))}
        </div>
      </section>

      <CompareStackedRows title="Key specifications" columnLabels={labels} rows={specRows} />
      <CompareStackedRows title="Best for" columnLabels={labels} rows={bestForRows} />
      <CompareStackedRows title="Who should avoid" columnLabels={labels} rows={avoidRows} />

      {hasProsCons ? (
        <section className="product-section">
          <h2 className="product-section-title">Pros and cons</h2>
          <div className={`mt-4 grid gap-4 ${columnClass(count)}`}>
            {products.map((product, index) => {
              const pros = splitLines(product.pros);
              const cons = splitLines(product.cons);
              if (pros.length === 0 && cons.length === 0) {
                return (
                  <div key={product.id} className="rounded-md border border-line bg-paper px-4 py-3">
                    <p className="text-xs font-semibold text-ink-muted">{labels[index]}</p>
                    <p className="mt-2 text-sm text-ink-subtle">No editorial pros or cons for this product.</p>
                  </div>
                );
              }
              return (
                <div key={product.id} className="rounded-md border border-line bg-paper px-4 py-3">
                  <p className="text-xs font-semibold text-ink-muted">{labels[index]}</p>
                  {pros.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 text-sm leading-6 text-ink">
                      {pros.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-forest" aria-hidden>
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {cons.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 text-sm leading-6 text-ink">
                      {cons.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-ink-muted" aria-hidden>
                            ×
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {body ? (
        <section className="product-section">
          <h2 className="product-section-title">How we compared them</h2>
          <div className="mt-4 text-sm leading-7 text-ink">
            <GuideBody body={body} />
          </div>
        </section>
      ) : null}

      <AffiliateNotice className="text-sm leading-6 text-ink-muted" />
    </div>
  );
}

function VsThumb({ product, isWinner }: { product: Product; isWinner: boolean }) {
  return (
    <Link href={`/products/${product.slug}`} className="min-w-0 text-center">
      <div className="mx-auto h-20 w-20 overflow-hidden rounded-md bg-paper sm:h-24 sm:w-24">
        <ProductImage src={product.imageUrl} alt={product.title} sizes="96px" className="h-20 sm:h-24" />
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-4 text-ink sm:text-sm">{compareColumnLabel(product)}</p>
      {isWinner ? <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-forest">Our pick</p> : null}
    </Link>
  );
}
