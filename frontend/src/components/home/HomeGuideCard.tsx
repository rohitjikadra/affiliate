import Link from "next/link";
import { ProductImage } from "@/components/media/ProductImage";
import type { Guide } from "@/types/guide";

export function HomeGuideCard({ guide }: { guide: Guide }) {
  const cover = guide.products[0]?.product;
  const count = guide.products.length;

  return (
    <Link
      href={`/best/${guide.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface shadow-[var(--shadow)] sm:flex-row"
    >
      <div className="bg-paper sm:w-40 sm:shrink-0">
        <ProductImage
          src={cover?.imageUrl}
          alt={cover?.title ?? guide.title}
          sizes="(min-width: 640px) 160px, 100vw"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">Best of</p>
        <h3 className="font-display mt-1 text-lg font-semibold leading-snug text-ink">{guide.title}</h3>
        {guide.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-muted">{guide.excerpt}</p> : null}
        {count > 0 ? (
          <p className="mt-2 text-xs text-ink-subtle">
            {count} {count === 1 ? "product" : "products"} in this shortlist
          </p>
        ) : null}
        <span className="mt-4 text-sm font-semibold text-forest">Read the guide</span>
      </div>
    </Link>
  );
}
