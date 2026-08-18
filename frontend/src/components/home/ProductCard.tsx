import Link from "next/link";
import type { Product } from "@/types/product";
import { formatMoney } from "@/lib/money";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const showOriginal =
    originalPrice !== null && !Number.isNaN(originalPrice) && originalPrice > price;
  const rating = product.rating ? Number(product.rating) : null;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-teal-700 text-4xl font-semibold text-white">
            {product.title.charAt(0)}
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            {product.category?.name ?? product.store}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{product.title}</h3>
          {product.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{product.description}</p>
          ) : null}
          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {Number.isNaN(price) ? product.price : formatMoney(price, product.currency, 0)}
              </p>
              {showOriginal ? (
                <p className="text-xs text-slate-400 line-through">
                  {formatMoney(originalPrice, product.currency, 0)}
                </p>
              ) : null}
            </div>
            {rating !== null && !Number.isNaN(rating) ? (
              <p className="text-xs font-medium text-slate-500">★ {rating.toFixed(1)}</p>
            ) : null}
          </div>
          <span className="mt-4 inline-flex justify-center rounded-xl bg-teal-700 px-3 py-2 text-sm font-medium text-white">
            {product.available ? `View on ${product.store}` : "View product"}
          </span>
        </div>
      </Link>
    </article>
  );
}
