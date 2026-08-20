import Link from "next/link";
import type { Product } from "@/types/product";
import { discountPercent, formatMoney, formatOptionalMoney } from "@/lib/money";
import { ScoreBadge } from "@/components/product/StarRating";
import { ProductImage } from "@/components/media/ProductImage";

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
          {score !== null && !Number.isNaN(score) ? <ScoreBadge score={score} className="mt-1" /> : null}
          <div className="mt-2">
            <p className="text-lg font-semibold text-neutral-900">
              {formattedPrice ?? "Check price on Amazon"}
            </p>
            {off && originalPrice !== null ? (
              <p className="text-xs text-neutral-500">
                <span className="line-through">M.R.P. {formatMoney(originalPrice, product.currency, 0)}</span>{" "}
                <span className="font-medium text-red-700">-{off}%</span>
              </p>
            ) : null}
          </div>
          <span className="mt-3 inline-flex w-fit justify-center rounded-full bg-cta px-3 py-1.5 text-xs font-bold text-navy hover:bg-cta-hover">
            View comparison
          </span>
        </div>
      </Link>
    </article>
  );
}
