import type { Category } from "@/types/catalog";

type CategoryGridProps = {
  categories: Category[];
  activeSlug?: string;
  onSelect: (slug: string) => void;
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

export function CategoryGrid({ categories, activeSlug, onSelect }: CategoryGridProps) {
  return (
    <section id="categories" className="scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Browse</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Product categories
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => {
          const isActive = activeSlug === category.slug;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(isActive ? "" : category.slug)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? "border-teal-700 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {icons[category.slug] ?? "•"}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{category.name}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{category.description}</p>
              <p className="mt-3 text-xs font-medium text-slate-400">
                {category.productCount} products
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
