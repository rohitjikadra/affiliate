import Link from "next/link";
import { OfferLegalNotes } from "@/components/legal/OfferLegalNotes";
import { ProductImage } from "@/components/media/ProductImage";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";
import { featuredBadgeLabel } from "@/lib/best-of";
import { ourScoreValue } from "@/lib/compare";
import { checkoutOffer, currentBestOffer, formatOfferPrice } from "@/lib/offers";
import { splitLines } from "@/lib/text";
import type { GuideProduct } from "@/types/guide";

type BestPickCardProps = {
  item: GuideProduct;
  rank: number;
};

export function BestPickCard({ item, rank }: BestPickCardProps) {
  const product = item.product;
  const badge = featuredBadgeLabel(item.badge);
  const best = currentBestOffer(product);
  const checkout = checkoutOffer(product);
  const priceLabel = best ? formatOfferPrice(best.price, best.currency, 0) : null;
  const score = ourScoreValue(product);
  const notes = item.notes?.trim() || null;
  const bestFor = product.bestFor?.trim() || null;
  const avoid = product.whoShouldAvoid?.trim() || null;
  const pros = splitLines(product.pros);
  const cons = splitLines(product.cons);
  const href = `/products/${product.slug}`;

  return (
    <article className="product-section mt-0">
      <div className="flex gap-4 sm:gap-8">
        <div className="w-[5.5rem] shrink-0 sm:w-44">
          <p className="font-display text-xl font-semibold tabular-nums tracking-tight text-forest sm:text-3xl">
            <span className="sr-only">Rank </span>#{rank}
          </p>
          <Link href={href} className="mt-2 block sm:mt-4">
            <ProductImage src={product.imageUrl} alt={product.title} sizes="(min-width: 640px) 176px, 88px" />
          </Link>
        </div>

        <div className="min-w-0 flex-1">
          {badge ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">{badge}</p>
          ) : null}
          {product.brand ? (
            <p className={`${badge ? "mt-1" : ""} text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted`}>
              {product.brand}
            </p>
          ) : null}
          <h2 className="mt-1 text-base font-semibold leading-snug text-ink sm:text-xl">
            <Link href={href} className="hover:text-forest">
              {product.title}
            </Link>
          </h2>
          {score != null ? (
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
                <p className="font-display text-xl font-semibold tabular-nums text-ink sm:text-2xl">{priceLabel}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-forest">Best current price</p>
                <FreshnessBadge level={best.freshness} label={best.freshnessLabel} className="mt-1" />
              </>
            ) : (
              <p className="text-sm font-semibold text-ink">Check price</p>
            )}
          </div>
        </div>
      </div>

      {notes ? <p className="mt-4 text-sm leading-7 text-ink">{notes}</p> : null}

      {bestFor ? (
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          <span className="font-semibold text-ink">Best for: </span>
          {bestFor}
        </p>
      ) : null}
      {avoid ? (
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          <span className="font-semibold text-ink">Who should avoid: </span>
          {avoid}
        </p>
      ) : null}

      {pros.length > 0 || cons.length > 0 ? (
        <div className={`mt-4 grid gap-4 ${pros.length > 0 && cons.length > 0 ? "sm:grid-cols-2" : ""}`}>
          {pros.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Pros</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink">
                {pros.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-forest" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {cons.length > 0 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Cons</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink">
                {cons.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-ink-muted" aria-hidden>
                      ×
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:[&_a]:w-auto [&_a]:w-full [&_a]:min-w-0">
        <BuyNowButton
          offerId={checkout?.id}
          merchantName={checkout?.merchant.name}
          available={Boolean(checkout)}
          compact
        />
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-md border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-paper"
        >
          View product
        </Link>
      </div>
      <OfferLegalNotes merchant={(best ?? checkout)?.merchant} className="mt-3 text-xs leading-5 text-ink-subtle" />
    </article>
  );
}
