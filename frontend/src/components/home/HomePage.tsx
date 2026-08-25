import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { HomeBanner } from "@/components/home/HomeBanner";
import { HomeComparisonCard } from "@/components/home/HomeComparisonCard";
import { HomeGuideCard } from "@/components/home/HomeGuideCard";
import { SearchBar } from "@/components/home/SearchBar";
import { ProductImage } from "@/components/media/ProductImage";
import { ProductGrid } from "@/components/product/ProductGrid";
import { listCategories, listComparisons, listGuides, listProducts } from "@/lib/api";
import { currentBestOffer } from "@/lib/offers";
import type { Product } from "@/types/product";
import type { ReactNode } from "react";

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

function eligibleBestPriceProducts(products: Product[], limit: number): Product[] {
  return uniqueById(products)
    .filter((product) => currentBestOffer(product))
    .slice(0, limit);
}

function HomeSection({
  id,
  title,
  description,
  href,
  linkLabel,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p> : null}
        </div>
        {href && linkLabel ? (
          <Link href={href} className="shrink-0 text-sm font-semibold text-forest hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export async function HomePage() {
  try {
    const [featured, catalog, bestOf, comparisons, trending, drops, categories] = await Promise.all([
      listProducts({ featured: true, limit: 8 }),
      listProducts({ limit: 24 }),
      listGuides({ kind: "BEST_OF", limit: 6 }),
      listComparisons({ limit: 4 }),
      listProducts({ sort: "trending", limit: 8 }),
      listProducts({ sort: "drops", limit: 8 }),
      listCategories(),
    ]);

    const bestPrices = eligibleBestPriceProducts([...featured.items, ...catalog.items], 8);
    const kitchenCategories = categories.filter((category) => (category.productCount ?? 0) > 0);

    return (
      <div className="shop-wrap space-y-12 py-8 sm:space-y-16 sm:py-12">
        <HomeBanner />

        {bestPrices.length > 0 ? (
          <HomeSection
            id="best-prices"
            title="Best current prices"
            description="Only products with an eligible in-stock offer we can show as current. Stale or missing prices stay hidden."
            href="/products"
            linkLabel="All products"
          >
            <ProductGrid products={bestPrices} emptyTitle="" />
          </HomeSection>
        ) : null}

        {trending.items.length > 0 ? (
          <HomeSection
            id="trending"
            title="Popular this week"
            description="Ranked by recent product page views on this site — not invented deals."
            href="/products"
            linkLabel="All products"
          >
            <ProductGrid products={trending.items} emptyTitle="" />
          </HomeSection>
        ) : null}

        {drops.items.length > 0 ? (
          <HomeSection
            id="drops"
            title="Biggest price drops"
            description="Only products with a recorded snapshot-to-snapshot drop."
            href="/products"
            linkLabel="All products"
          >
            <ProductGrid products={drops.items} emptyTitle="" />
          </HomeSection>
        ) : null}

        {bestOf.items.length > 0 ? (
          <HomeSection
            id="guides"
            title="Best guides"
            description="Editorial shortlists for Indian kitchens. Confirm the live price on each product page."
            href="/best"
            linkLabel="All best-of"
          >
            <ul className="grid gap-4 lg:grid-cols-2">
              {bestOf.items.map((guide) => (
                <li key={guide.id}>
                  <HomeGuideCard guide={guide} />
                </li>
              ))}
            </ul>
          </HomeSection>
        ) : null}

        {comparisons.items.length > 0 ? (
          <HomeSection
            id="compare"
            title="Popular comparisons"
            description="Side-by-side picks when two appliances look similar on paper."
            href="/compare"
            linkLabel="All comparisons"
          >
            <ul className="grid gap-4 sm:grid-cols-2">
              {comparisons.items.map((item) => (
                <li key={item.id}>
                  <HomeComparisonCard comparison={item} />
                </li>
              ))}
            </ul>
          </HomeSection>
        ) : null}

        {kitchenCategories.length > 0 ? (
          <HomeSection
            id="categories"
            title="Kitchen categories"
            description="This shop is kitchen appliances only — browse the catalog by the categories we actually stock."
            href="/products"
            linkLabel="All products"
          >
            <ul className={`grid gap-4 ${kitchenCategories.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {kitchenCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="flex h-full gap-4 overflow-hidden rounded-md border border-line bg-surface p-4 shadow-[var(--shadow)]"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-paper">
                      <ProductImage src={category.imageUrl} alt={category.name} sizes="80px" className="h-20" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-ink">{category.name}</h3>
                      {category.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-muted">{category.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-ink-subtle">
                        {category.productCount} {category.productCount === 1 ? "product" : "products"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </HomeSection>
        ) : null}

        <section className="rounded-md bg-forest-soft px-5 py-8 sm:px-8 sm:py-10">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Search or compare before you buy
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
            Look up a model, or open a side-by-side if you already have a shortlist. We do not invent deals.
          </p>
          <div className="mt-5 max-w-2xl">
            <SearchBar variant="hero" inputId="home-search-again" />
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
            <Link href="/products" className="text-forest hover:underline">
              Browse products
            </Link>
            <Link href="/compare" className="text-forest hover:underline">
              Compare
            </Link>
            <Link href="/best" className="text-forest hover:underline">
              Best-of guides
            </Link>
          </div>
        </section>
      </div>
    );
  } catch {
    return (
      <div className="shop-wrap py-10">
        <CatalogUnavailable />
      </div>
    );
  }
}
