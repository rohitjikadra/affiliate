import Link from "next/link";
import type { ProductCategory } from "@/types/product";

type CategoryGridProps = {
  categories: ProductCategory[];
};

const icons: Record<string, string> = {
  electronics: "⚡",
  fashion: "👕",
  "home-kitchen": "🏠",
  beauty: "✨",
  sports: "🏃",
  books: "📚",
  grocery: "🛒",
  toys: "🧸",
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <section id="categories" className="scroll-mt-24">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">No categories yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="categories" className="scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Browse</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Product categories
          </h2>
        </div>
        <Link href="/products" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <span className="text-xl" aria-hidden="true">
              {icons[category.slug] ?? "•"}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{category.name}</h3>
            {category.description ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">{category.description}</p>
            ) : null}
            <p className="mt-3 text-xs font-medium text-slate-400">
              {category.productCount ?? 0} products
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
