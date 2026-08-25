import Link from "next/link";
import { ProductImage } from "@/components/media/ProductImage";
import { ProductSection } from "@/components/product/ProductSection";
import type { Comparison } from "@/types/comparison";
import type { Guide } from "@/types/guide";

type RelatedContentProps = {
  guides?: Guide[];
  comparisons?: Comparison[];
};

export function RelatedContent({ guides = [], comparisons = [] }: RelatedContentProps) {
  if (guides.length === 0 && comparisons.length === 0) {
    return null;
  }

  return (
    <>
      {comparisons.length > 0 ? (
        <ProductSection title="Compare with similar products">
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {comparisons.map((item) => {
              const thumbs = item.items.slice(0, 2).map((entry) => entry.product);
              return (
                <li key={item.id}>
                  <Link
                    href={`/compare/${item.slug}`}
                    className="flex h-full gap-3 rounded-md border border-line p-3 hover:border-forest"
                  >
                    {thumbs.length > 0 ? (
                      <div className="flex shrink-0 gap-1">
                        {thumbs.map((product) => (
                          <div key={product.id} className="h-14 w-14 overflow-hidden rounded-sm bg-paper">
                            <ProductImage src={product.imageUrl} alt={product.title} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      {item.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{item.excerpt}</p> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </ProductSection>
      ) : null}
      {guides.length > 0 ? (
        <ProductSection title="Related guides">
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {guides.map((guide) => {
              const cover = guide.products[0]?.product;
              const href = guide.kind === "BEST_OF" ? `/best/${guide.slug}` : `/guides/${guide.slug}`;
              return (
                <li key={guide.id}>
                  <Link href={href} className="flex h-full gap-3 rounded-md border border-line p-3 hover:border-forest">
                    {cover ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-paper">
                        <ProductImage src={cover.imageUrl} alt={cover.title} />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                        {guide.kind === "BEST_OF" ? "Best of" : "Guide"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">{guide.title}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </ProductSection>
      ) : null}
    </>
  );
}
