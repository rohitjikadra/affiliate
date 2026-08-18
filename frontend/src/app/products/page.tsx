import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { SearchBar } from "@/components/home/SearchBar";
import { ProductGrid } from "@/components/product/ProductGrid";
import { listProducts } from "@/lib/api";

type ProductsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  try {
    const products = await listProducts(query ? { q: query } : {});

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Catalog</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {query ? `Results for “${query}”` : "All products"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {query
            ? `${products.length} matching ${products.length === 1 ? "product" : "products"}`
            : "Browse active products in the catalog."}
        </p>
        <div className="mt-8">
          <SearchBar defaultValue={query} />
        </div>
        <div className="mt-10">
          <ProductGrid
            products={products}
            emptyTitle={query ? `No products match “${query}”.` : "No products yet."}
            emptyDescription={
              query
                ? "Try another keyword, or browse categories from the home page."
                : "Add products in admin to populate the catalog."
            }
          />
        </div>
        {query ? (
          <p className="mt-8 text-center text-sm">
            <Link href="/products" className="font-semibold text-teal-700 hover:text-teal-800">
              Clear search
            </Link>
          </p>
        ) : null}
      </div>
    );
  } catch {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <CatalogUnavailable />
      </div>
    );
  }
}
