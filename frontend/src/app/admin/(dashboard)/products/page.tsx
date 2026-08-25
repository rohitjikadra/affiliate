import Link from "next/link";
import { ProductTable } from "@/components/admin/ProductTable";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { Pagination } from "@/components/catalog/Pagination";
import { listProducts } from "@/lib/api";

type AdminProductsPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const { q = "", page } = await searchParams;
  const query = q.trim();

  try {
    const { items, meta } = await listProducts({
      includeInactive: true,
      ...(query ? { q: query } : {}),
      page: Number(page) || 1,
      limit: 50,
    });

    return (
      <section>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            {query
              ? `${meta.total} matching ${meta.total === 1 ? "product" : "products"}`
              : `${meta.total} products in the catalog`}
          </p>
          <div className="flex gap-4">
            <Link href="/admin/products/create" className="text-sm font-semibold text-navy hover:underline">
              Add product
            </Link>
            <Link href="/admin/import" className="text-sm font-semibold text-navy hover:underline">
              Amazon ASIN Import
            </Link>
          </div>
        </div>
        <form action="/admin/products" method="get" className="mb-4 flex max-w-md">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search products"
            className="h-10 w-full rounded-l-md border border-neutral-300 px-3 text-sm outline-none focus:border-navy"
          />
          <button type="submit" className="h-10 rounded-r-md bg-navy px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>
        <ProductTable key={query} initialProducts={items} />
        <Pagination meta={meta} basePath={query ? `/admin/products?q=${encodeURIComponent(query)}` : "/admin/products"} />
      </section>
    );
  } catch {
    return <CatalogUnavailable />;
  }
}
