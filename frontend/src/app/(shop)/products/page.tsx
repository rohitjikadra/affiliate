import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { Pagination } from "@/components/catalog/Pagination";
import { SearchBar } from "@/components/home/SearchBar";
import { ProductGrid } from "@/components/product/ProductGrid";
import { listProducts } from "@/lib/api";
import { publicMetadata } from "@/lib/seo";
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

  try {
    const { items, meta } = await listProducts({
      ...(query ? { q: query } : {}),
      page,
      limit: 24,
    });

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-md bg-white px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-navy">{query ? `Results for “${query}”` : "All products"}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {query
              ? `${meta.total} matching ${meta.total === 1 ? "product" : "products"}`
              : "Search title, brand, or model. Browse active products in the catalog."}
          </p>
          <div className="mt-4 md:hidden">
            <SearchBar defaultValue={query} />
          </div>
        </div>
        <div className="mt-4">
          <ProductGrid
            products={items}
            emptyTitle={query ? `No products match “${query}”.` : "No products yet."}
            emptyDescription={query ? "Try another keyword, or browse categories from the home page." : "Add products in admin."}
          />
        </div>
        <Pagination meta={meta} basePath={query ? `/products?q=${encodeURIComponent(query)}` : "/products"} />
        {query ? (
          <p className="mt-6 text-center text-sm">
            <Link href="/products" className="font-medium text-navy underline">
              Clear search
            </Link>
          </p>
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
