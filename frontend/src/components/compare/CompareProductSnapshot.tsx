import Link from "next/link";
import { ProductImage } from "@/components/media/ProductImage";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";
import { ourScoreValue } from "@/lib/compare";
import { checkoutOffer, currentBestOffer, formatOfferPrice } from "@/lib/offers";
import type { Product } from "@/types/product";

type CompareProductSnapshotProps = {
  product: Product;
  notes?: string | null;
  isWinner?: boolean;
};

export function CompareProductSnapshot({ product, notes, isWinner = false }: CompareProductSnapshotProps) {
  const best = currentBestOffer(product);
  const checkout = checkoutOffer(product);
  const priceLabel = best ? formatOfferPrice(best.price, best.currency, 0) : null;
  const score = ourScoreValue(product);

  return (
    <article className="product-section mt-0 flex h-full flex-col">
      {isWinner ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">Our pick</p>
      ) : null}
      <Link href={`/products/${product.slug}`} className="mt-1 block">
        <div className="mx-auto max-w-[12rem]">
          <ProductImage
            src={product.imageUrl}
            alt={product.title}
            sizes="(min-width: 768px) 20vw, 60vw"
          />
        </div>
        {product.brand ? (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{product.brand}</p>
        ) : null}
        <h3 className="mt-1 text-base font-semibold leading-snug text-ink">{product.title}</h3>
      </Link>
      {notes ? <p className="mt-2 text-sm leading-6 text-ink-muted">{notes}</p> : null}
      {score != null ? (
        <p className="mt-3 inline-flex items-center gap-1.5">
          <span className="rounded-md bg-forest px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">Our Score</span>
        </p>
      ) : null}
      <div className="mt-3">
        {best && priceLabel ? (
          <>
            <p className="font-display text-xl font-semibold tabular-nums text-ink">{priceLabel}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-forest">Best current price</p>
            <FreshnessBadge level={best.freshness} label={best.freshnessLabel} className="mt-1" />
          </>
        ) : (
          <p className="text-sm font-semibold text-ink">Check price</p>
        )}
      </div>
      <div className="mt-4 space-y-2 [&_a]:w-full [&_a]:min-w-0">
        <BuyNowButton
          offerId={checkout?.id}
          merchantName={checkout?.merchant.name}
          available={Boolean(checkout)}
          compact
        />
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex w-full items-center justify-center rounded-md border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
        >
          View product
        </Link>
      </div>
    </article>
  );
}
