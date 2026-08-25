import Link from "next/link";
import { ProductImage } from "@/components/media/ProductImage";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";
import { checkoutOffer, currentBestOffer, formatOfferPrice } from "@/lib/offers";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const best = currentBestOffer(product);
  const checkout = checkoutOffer(product);
  const priceLabel = best ? formatOfferPrice(best.price, best.currency, 0) : null;
  const score = product.ourScore != null ? Number(product.ourScore) : null;
  const showScore = score != null && Number.isFinite(score);
  const bestFor = product.bestFor?.trim() || null;
  const href = `/products/${product.slug}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface shadow-[var(--shadow)] transition-shadow hover:shadow-md">
      <Link href={href} className="flex min-h-0 flex-1 flex-col">
        <div className="bg-paper px-3 pt-3">
          <ProductImage
            src={product.imageUrl}
            alt={product.title}
            sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
          />
        </div>
        <div className="flex flex-1 flex-col px-3 pb-1 pt-3">
          {product.brand ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{product.brand}</p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-ink">{product.title}</h3>
          {showScore ? (
            <p className="mt-2 inline-flex items-center gap-1.5">
              <span className="rounded-md bg-forest px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white">
                {score.toFixed(1)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">Our Score</span>
            </p>
          ) : null}
          <div className="mt-2">
            {best && priceLabel ? (
              <>
                <p className="font-display text-lg font-semibold tabular-nums leading-none text-ink">{priceLabel}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-forest">Best current price</p>
                <FreshnessBadge level={best.freshness} label={best.freshnessLabel} className="mt-1" />
              </>
            ) : (
              <p className="text-sm font-semibold text-ink">Check price</p>
            )}
          </div>
          {bestFor ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-muted">{bestFor}</p> : null}
        </div>
      </Link>
      <div className={`mt-auto grid gap-2 px-3 pb-3 pt-2 ${checkout ? "grid-cols-2" : "grid-cols-1"}`}>
        <Link
          href={href}
          aria-label={`View ${product.title}`}
          className="inline-flex items-center justify-center rounded-md border border-line bg-surface px-2 py-2 text-xs font-semibold text-ink hover:bg-paper"
        >
          View product
        </Link>
        {checkout ? (
          <a
            href={`/go/${checkout.id}`}
            rel="nofollow sponsored"
            aria-label={`Buy ${product.title} on ${checkout.merchant.name}`}
            className="btn-buy btn-buy-compact !w-full min-w-0 px-2 py-2 text-xs"
          >
            Buy
          </a>
        ) : null}
      </div>
    </article>
  );
}
