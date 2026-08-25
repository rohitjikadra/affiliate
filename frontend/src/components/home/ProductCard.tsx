import Link from "next/link";
import type { Product } from "@/types/product";
import { discountPercent, formatMoney, formatOptionalMoney } from "@/lib/money";
import { ScoreBadge } from "@/components/product/StarRating";
import { ProductImage } from "@/components/media/ProductImage";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";

export function ProductCard({ product }: { product: Product }) {
  const price = product.price != null ? Number(product.price) : NaN;
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const off =
    originalPrice !== null && !Number.isNaN(originalPrice) && !Number.isNaN(price)
      ? discountPercent(price, originalPrice)
      : null;
  const score = product.ourScore ? Number(product.ourScore) : null;
  const formattedPrice = formatOptionalMoney(product.price, product.currency, 0);

  return (
    <article className="flex flex-col bg-white p-3 transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <ProductImage src={product.imageUrl} alt={product.title} />
        <div className="mt-2 flex flex-1 flex-col">
          <p className="line-clamp-2 min-h-10 text-sm text-neutral-900">{product.title}</p>
          {product.brand ? <p className="mt-1 text-xs font-medium text-neutral-500">{product.brand}</p> : null}
          {score !== null && !Number.isNaN(score) ? <ScoreBadge score={score} className="mt-1" /> : null}
          <div className="mt-2">
            <p className="text-lg font-semibold text-neutral-900">
              {formattedPrice ?? "Price unavailable"}
            </p>
            <FreshnessBadge level={product.freshness} label={product.freshnessLabel} className="mt-1" />
            {off && originalPrice !== null ? (
              <p className="text-xs text-neutral-500">
                <span className="line-through">M.R.P. {formatMoney(originalPrice, product.currency, 0)}</span>{" "}
                <span className="font-medium text-red-700">-{off}%</span>
              </p>
            ) : null}
          </div>
          <span className="mt-3 inline-flex w-fit justify-center rounded-full bg-cta px-3 py-1.5 text-xs font-bold text-white hover:bg-cta-hover">
            See prices
          </span>
        </div>
      </Link>
    </article>
  );
}
