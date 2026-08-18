import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategory, listProducts } from "@/lib/api";
import { ApiError } from "@/types/product";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  try {
    const [category, products] = await Promise.all([
      getCategory(slug),
      listProducts({ category: slug }),
    ]);

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-800">
            Home
          </Link>
          <span className="px-2">/</span>
          <span>{category.name}</span>
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{category.description}</p>
        ) : null}
        <p className="mt-3 text-sm text-slate-500">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
        <div className="mt-10">
          <ProductGrid
            products={products}
            emptyTitle={`No products in ${category.name} yet.`}
            emptyDescription="Check another category, or browse the full catalog."
          />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <CatalogUnavailable />
      </div>
    );
  }
}
