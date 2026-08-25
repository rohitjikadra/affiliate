import Link from "next/link";
import { ProductImage } from "@/components/media/ProductImage";
import type { Comparison } from "@/types/comparison";

export function HomeComparisonCard({ comparison }: { comparison: Comparison }) {
  const thumbs = comparison.items.slice(0, 3).map((item) => item.product);

  return (
    <Link
      href={`/compare/${comparison.slug}`}
      className="flex h-full flex-col rounded-md border border-line bg-surface p-4 shadow-[var(--shadow)]"
    >
      <div className="flex gap-2">
        {thumbs.map((product) => (
          <div key={product.id} className="h-16 w-16 overflow-hidden rounded-md bg-paper">
            <ProductImage src={product.imageUrl} alt={product.title} sizes="64px" className="h-16" />
          </div>
        ))}
      </div>
      <h3 className="font-display mt-3 text-base font-semibold leading-snug text-ink">{comparison.title}</h3>
      {comparison.excerpt ? (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">{comparison.excerpt}</p>
      ) : null}
      <span className="mt-auto pt-4 text-sm font-semibold text-forest">Compare products</span>
    </Link>
  );
}
