import type { Product } from "@/types/catalog";
import { formatPrice } from "@/lib/mock-data";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        className="flex h-36 items-center justify-center text-4xl font-semibold text-white"
        style={{ backgroundColor: product.accent }}
        aria-hidden="true"
      >
        {product.title.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          {product.categoryName}
        </p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
          {product.description}
        </p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <p className="text-lg font-semibold text-slate-900">
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="text-xs font-medium text-slate-500">★ {product.rating.toFixed(1)}</p>
        </div>
        <button
          type="button"
          disabled
          className="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
        >
          Affiliate links coming soon
        </button>
      </div>
    </article>
  );
}
