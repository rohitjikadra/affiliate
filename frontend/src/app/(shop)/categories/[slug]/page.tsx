import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { getCategory, listProducts } from "@/lib/api";
import { publicMetadata } from "@/lib/seo";
import { handleMoved } from "@/lib/redirects";
import { ApiError } from "@/types/product";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return publicMetadata({
      title: category.name,
      description: category.description ?? `Products in ${category.name}.`,
      path: `/categories/${category.slug}`,
    });
  } catch (error) {
    handleMoved(error, "/categories");
    return publicMetadata({ title: "Category", path: `/categories/${slug}` });
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const page = Number((await searchParams).page) || 1;

  try {
    const [category, listed] = await Promise.all([
      getCategory(slug),
      listProducts({ category: slug, page, limit: 24 }),
    ]);

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <TrackPageView path={`/categories/${category.slug}`} entityType="category" entityId={category.id} />
        <div className="rounded-md bg-white px-4 py-5 sm:px-6">
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="px-2">/</span>
            <span>{category.name}</span>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">{category.name}</h1>
          {category.description ? <p className="mt-2 max-w-2xl text-sm text-neutral-600">{category.description}</p> : null}
          <p className="mt-2 text-sm text-neutral-500">
            {listed.meta.total} {listed.meta.total === 1 ? "product" : "products"}
          </p>
        </div>
        <div className="mt-4">
          <ProductGrid
            products={listed.items}
            emptyTitle={`No products in ${category.name} yet.`}
            emptyDescription="Check another category, or browse the full catalog."
          />
        </div>
        <Pagination meta={listed.meta} basePath={`/categories/${category.slug}`} />
      </div>
    );
  } catch (error) {
    handleMoved(error, "/categories");
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <CatalogUnavailable />
      </div>
    );
  }
}
