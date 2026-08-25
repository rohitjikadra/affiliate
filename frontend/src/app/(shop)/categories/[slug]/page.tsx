import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { Pagination } from "@/components/catalog/Pagination";
import { ProductGrid } from "@/components/product/ProductGrid";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getCategory, listProducts } from "@/lib/api";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { handleMoved } from "@/lib/redirects";
import { ApiError } from "@/types/product";
import Link from "next/link";

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

    const crumbs = [
      { name: "Home", path: "/" },
      { name: category.name, path: `/categories/${category.slug}` },
    ];

    return (
      <div className="shop-wrap py-6 sm:py-10">
        <TrackPageView path={`/categories/${category.slug}`} entityType="category" entityId={category.id} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(crumbs)) }} />
        <Breadcrumb items={[{ name: "Home", href: "/" }, { name: category.name }]} />
        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Kitchen category</p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">{category.description}</p>
          ) : null}
          <p className="mt-3 text-sm text-ink-subtle">
            {listed.meta.total} {listed.meta.total === 1 ? "product" : "products"}
          </p>
        </header>
        <div className="mt-8">
          <ProductGrid
            products={listed.items}
            emptyTitle={`No products in ${category.name} yet.`}
            emptyDescription="Check another category, or browse the full catalog."
            emptyAction={
              <Link href="/products" className="text-sm font-semibold text-forest underline">
                Browse all products
              </Link>
            }
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
      <div className="shop-wrap py-10">
        <CatalogUnavailable />
      </div>
    );
  }
}
