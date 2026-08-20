import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HomeBanner } from "@/components/home/HomeBanner";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { listComparisons, listGuides, listProducts } from "@/lib/api";
import Link from "next/link";

export async function HomePage() {
  try {
    const [featured, bestOf, comparisons] = await Promise.all([
      listProducts({ featured: true, limit: 8 }),
      listGuides({ kind: "BEST_OF", limit: 8 }),
      listComparisons({ limit: 4 }),
    ]);

    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4 sm:px-6">
        <HomeBanner product={featured.items[0]} />
        {bestOf.items.length > 0 ? (
          <section id="guides" className="scroll-mt-24 rounded-md bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">Start with a buying guide</h2>
              <Link href="/guides" className="text-sm text-navy underline">
                All guides
              </Link>
            </div>
            <p className="mb-4 text-sm text-neutral-600">
              Mixer grinders, air fryers, induction cooktops, kettles, and hand blenders for Indian kitchens.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {bestOf.items.map((guide) => (
                <li key={guide.id}>
                  <Link href={`/best/${guide.slug}`} className="block rounded-md border border-neutral-200 p-4 hover:border-navy">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Best of</p>
                    <p className="mt-1 font-semibold text-navy">{guide.title}</p>
                    {guide.excerpt ? <p className="mt-1 text-sm text-neutral-600">{guide.excerpt}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {comparisons.items.length > 0 ? (
          <section className="rounded-md bg-white p-5">
            <h2 className="text-lg font-bold text-navy">Comparisons</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {comparisons.items.map((item) => (
                <li key={item.id}>
                  <Link href={`/compare/${item.slug}`} className="block rounded-md border border-neutral-200 p-4 hover:border-navy">
                    <p className="font-semibold text-navy">{item.title}</p>
                    {item.excerpt ? <p className="mt-1 text-sm text-neutral-600">{item.excerpt}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <FeaturedProducts products={featured.items} />
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
