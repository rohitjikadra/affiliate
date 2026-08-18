import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { SearchBar } from "@/components/home/SearchBar";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { listCategories, listProducts } from "@/lib/api";

export async function HomePage() {
  try {
    const [categories, products] = await Promise.all([
      listCategories(),
      listProducts({ featured: true }),
    ]);

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="mb-14 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
            Product discovery
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Find products worth recommending.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Search the catalog, browse categories, and explore featured picks. Buy on Amazon
            through tracked affiliate links.
          </p>
          <div className="mt-8">
            <SearchBar />
          </div>
        </section>

        <div className="space-y-14">
          <CategoryGrid categories={categories} />
          <FeaturedProducts products={products} />
        </div>
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
