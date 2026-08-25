import Link from "next/link";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HomeBanner } from "@/components/home/HomeBanner";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImage } from "@/components/media/ProductImage";
import { listComparisons, listGuides, listProducts } from "@/lib/api";
import type { Comparison } from "@/types/comparison";
import type { Guide } from "@/types/guide";
import type { Product } from "@/types/product";

function uniqueById(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
}

function GuideCard({ guide }: { guide: Guide }) {
  const thumbs = guide.products.slice(0, 3).map((item) => item.product);
  const cover = thumbs[0];

  return (
    <Link
      href={`/best/${guide.slug}`}
      className="flex h-full overflow-hidden rounded-md border border-neutral-200 bg-white hover:border-navy"
    >
      <div className="h-28 w-28 shrink-0 bg-neutral-50 sm:h-32 sm:w-32">
        <ProductImage src={cover?.imageUrl} alt={cover?.title ?? guide.title} />
      </div>
      <div className="min-w-0 flex-1 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Best of</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-navy">{guide.title}</p>
        {guide.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{guide.excerpt}</p> : null}
        {thumbs.length > 1 ? (
          <div className="mt-2 flex -space-x-2">
            {thumbs.slice(1).map((product) => (
              <div key={product.id} className="h-8 w-8 overflow-hidden rounded-full border border-white bg-white">
                <ProductImage src={product.imageUrl} alt="" className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function ComparisonCard({ comparison }: { comparison: Comparison }) {
  const thumbs = comparison.items.slice(0, 3).map((item) => item.product);

  return (
    <Link
      href={`/compare/${comparison.slug}`}
      className="block h-full rounded-md border border-neutral-200 bg-white p-4 hover:border-navy"
    >
      <div className="flex gap-2">
        {thumbs.map((product) => (
          <div key={product.id} className="h-16 w-16 overflow-hidden rounded-md bg-neutral-50">
            <ProductImage src={product.imageUrl} alt={product.title} />
          </div>
        ))}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold text-navy">{comparison.title}</p>
      {comparison.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{comparison.excerpt}</p> : null}
    </Link>
  );
}

export async function HomePage() {
  try {
    const [featured, catalog, bestOf, comparisons, trending, drops] = await Promise.all([
      listProducts({ featured: true, limit: 8 }),
      listProducts({ limit: 8 }),
      listGuides({ kind: "BEST_OF", limit: 4 }),
      listComparisons({ limit: 4 }),
      listProducts({ sort: "trending", limit: 8 }),
      listProducts({ sort: "drops", limit: 8 }),
    ]);

    const shop = uniqueById(featured.items.length > 0 ? featured.items : catalog.items);
    const shopIds = new Set(shop.map((product) => product.id));
    const extraTrending = trending.items.filter((product) => !shopIds.has(product.id));
    const extraDrops = drops.items.filter((product) => !shopIds.has(product.id));

    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4 sm:px-6">
        <HomeBanner />
        <FeaturedProducts products={shop} />
        {bestOf.items.length > 0 ? (
          <section id="guides" className="scroll-mt-24 rounded-md bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Need help choosing?</h2>
              <Link href="/best" className="text-sm font-medium text-navy hover:underline">
                All best-of
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {bestOf.items.map((guide) => (
                <li key={guide.id}>
                  <GuideCard guide={guide} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {comparisons.items.length > 0 ? (
          <section className="rounded-md bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Side-by-side</h2>
              <Link href="/compare" className="text-sm font-medium text-navy hover:underline">
                All comparisons
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {comparisons.items.map((item) => (
                <li key={item.id}>
                  <ComparisonCard comparison={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {extraTrending.length > 0 ? (
          <section className="rounded-md bg-white p-5">
            <h2 className="text-lg font-bold text-navy">Trending this week</h2>
            <p className="mt-1 text-sm text-neutral-600">Ranked by recent product page views — not invented deals.</p>
            <div className="mt-4">
              <ProductGrid products={extraTrending} emptyTitle="" emptyDescription="" />
            </div>
          </section>
        ) : null}
        {extraDrops.length > 0 ? (
          <section className="rounded-md bg-white p-5">
            <h2 className="text-lg font-bold text-navy">Recorded price drops</h2>
            <p className="mt-1 text-sm text-neutral-600">Only products with a real snapshot-to-snapshot drop.</p>
            <div className="mt-4">
              <ProductGrid products={extraDrops} emptyTitle="" emptyDescription="" />
            </div>
          </section>
        ) : null}
      </div>
    );
  } catch {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <CatalogUnavailable />
      </div>
    );
  }
}
