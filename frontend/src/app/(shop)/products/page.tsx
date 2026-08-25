import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { Pagination } from "@/components/catalog/Pagination";
import { SearchBar } from "@/components/home/SearchBar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProductGrid } from "@/components/product/ProductGrid";
import { listProducts } from "@/lib/api";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

type ProductsPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const { q = "" } = await searchParams;
  const query = q.trim();
  return publicMetadata({
    title: query ? `Search: ${query}` : "All products",
    description: query
      ? `Search results for ${query} on ${SITE_NAME}. Search title, brand, or model.`
      : "Search kitchen appliances by title, brand, or model. Editorial scores and current merchant offers.",
    path: query ? `/products?q=${encodeURIComponent(query)}` : "/products",
    noIndex: Boolean(query),
  });
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q = "", page: pageValue } = await searchParams;
  const query = q.trim();
  const page = Number(pageValue) || 1;
  const isSearch = Boolean(query);

  try {
    const { items, meta } = await listProducts({
      ...(query ? { q: query } : {}),
      page,
      limit: 24,
    });

    const breadcrumbs = isSearch
      ? [
          { name: "Home", href: "/" },
          { name: "All products", href: "/products" },
          { name: `Search: ${query}` },
        ]
      : [
          { name: "Home", href: "/" },
          { name: "All products" },
        ];

    return (
      <div className="shop-wrap py-6 sm:py-10">
        {!isSearch ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLd(
                breadcrumbJsonLd([
                  { name: "Home", path: "/" },
                  { name: "All products", path: "/products" },
                ]),
              ),
            }}
          />
        ) : null}
        <Breadcrumb items={breadcrumbs} />
        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
            {isSearch ? "Search" : "Catalog"}
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {isSearch ? `Results for “${query}”` : "All products"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            {isSearch
              ? `${meta.total} matching ${meta.total === 1 ? "product" : "products"}. Search looks at title, brand, and model.`
              : "Search title, brand, or model. Prices on cards are eligible current offers only."}
          </p>
          <div className="mt-5 max-w-2xl">
            <SearchBar variant="hero" defaultValue={query} autoFocus={isSearch} inputId="catalog-search" />
          </div>
          {isSearch ? (
            <p className="mt-3 text-sm">
              <Link href="/products" className="font-semibold text-forest underline">
                Clear search
              </Link>
            </p>
          ) : null}
        </header>
        <div className="mt-8">
          <ProductGrid
            products={items}
            emptyTitle={isSearch ? `No products match “${query}”.` : "No products yet."}
            emptyDescription={
              isSearch
                ? "Try another keyword, or browse the kitchen catalog."
                : "Add products in admin, or check back after import."
            }
            emptyAction={
              isSearch ? (
                <Link href="/products" className="text-sm font-semibold text-forest underline">
                  Browse all products
                </Link>
              ) : null
            }
          />
        </div>
        <Pagination meta={meta} basePath={isSearch ? `/products?q=${encodeURIComponent(query)}` : "/products"} />
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
