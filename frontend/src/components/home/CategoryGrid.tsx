import Link from "next/link";
import type { ProductCategory } from "@/types/product";

type CategoryGridProps = {
  categories: ProductCategory[];
};

function productCountLabel(count: number): string {
  return `${count} ${count === 1 ? "product" : "products"}`;
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <section id="categories" className="scroll-mt-24">
        <p className="text-sm text-neutral-600">No categories yet.</p>
      </section>
    );
  }

  return (
    <section id="categories" className="scroll-mt-24 rounded-md bg-white px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">Shop by category</h2>
        <Link href="/products" className="text-sm font-medium text-navy hover:underline">
          See all
        </Link>
      </div>
      <div className="scrollbar-none flex gap-4 overflow-x-auto pb-1">
        {categories.map((category) => {
          const count = category.productCount ?? 0;
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="flex w-24 shrink-0 flex-col items-center text-center"
            >
              {category.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.imageUrl}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-1 ring-neutral-200"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-navy ring-1 ring-neutral-200">
                  {category.name.charAt(0)}
                </span>
              )}
              <h3 className="mt-2 line-clamp-2 text-xs font-medium text-neutral-900">{category.name}</h3>
              <p className="text-[11px] text-neutral-500">{productCountLabel(count)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
