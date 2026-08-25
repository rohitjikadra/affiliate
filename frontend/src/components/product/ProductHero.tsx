import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { OfferLegalNotes } from "@/components/legal/OfferLegalNotes";
import { ProductGallery } from "@/components/media/ProductGallery";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";
import { ScoreCard } from "@/components/product/ScoreCard";
import { discountPercent, formatMoney } from "@/lib/money";
import {
  availabilityLabel,
  checkoutOffer,
  currentBestOffer,
  formatOfferPrice,
  numericOfferPrice,
} from "@/lib/offers";
import type { Product } from "@/types/product";

export function ProductHero({ product }: { product: Product }) {
  const best = currentBestOffer(product);
  const checkout = checkoutOffer(product);
  const priceLabel = best ? formatOfferPrice(best.price, best.currency) : null;
  const original = best ? numericOfferPrice(best.originalPrice) : null;
  const current = best ? numericOfferPrice(best.price) : null;
  const off = current != null && original != null ? discountPercent(current, original) : null;
  const score = product.ourScore ? Number(product.ourScore) : null;
  const merchantName = checkout?.merchant.name ?? product.store;
  const pricedMerchant = (best ?? checkout)?.merchant;

  return (
    <div className="product-section grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <ProductGallery images={product.images ?? []} imageUrl={product.imageUrl} alt={product.title} />
      <div>
        {product.brand ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">{product.brand}</p>
        ) : null}
        <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{product.title}</h1>
        {product.modelNumber ? <p className="mt-1 text-sm text-ink-muted">{product.modelNumber}</p> : null}

        {score !== null && !Number.isNaN(score) ? (
          <div className="mt-5">
            <ScoreCard score={score} breakdown={product.scoreBreakdown} />
          </div>
        ) : null}

        {product.bestFor ? <p className="mt-5 text-base leading-7 text-ink">{product.bestFor}</p> : null}

        <div className="mt-6 border-t border-line pt-5">
          {best && priceLabel ? (
            <>
              {off ? <p className="text-sm font-medium text-forest">-{off}%</p> : null}
              <p className="font-display text-3xl font-semibold tabular-nums text-ink">{priceLabel}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-forest">Best current price</p>
              <p className="mt-1 text-sm text-ink">{best.merchant.name}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{availabilityLabel(best)}</p>
              <FreshnessBadge level={best.freshness} label={best.freshnessLabel} className="mt-2" />
              {off && original != null ? (
                <p className="mt-1 text-sm text-ink-subtle">
                  Was <span className="line-through">{formatMoney(original, best.currency, 0)}</span>
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-ink">Check price on {merchantName || "merchant"}</p>
              <p className="mt-1 text-sm text-ink-muted">No fresh in-stock price to show as current.</p>
              {checkout ? (
                <FreshnessBadge level={checkout.freshness} label={checkout.freshnessLabel} className="mt-2" />
              ) : null}
            </>
          )}
          {product.warranty ? <p className="mt-2 text-sm text-ink-muted">{product.warranty}</p> : null}
          <OfferLegalNotes merchant={pricedMerchant} className="mt-3 max-w-md text-xs leading-5 text-ink-subtle" />
        </div>

        <div id="product-hero-cta" className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <BuyNowButton
            offerId={checkout?.id}
            merchantName={merchantName}
            available={Boolean(checkout?.available)}
          />
          <a href="#price-alert" className="btn-secondary w-full sm:w-auto">
            Alert me when price drops
          </a>
        </div>
        <AffiliateNotice className="mt-3 hidden text-sm text-ink-muted sm:block" />
      </div>
    </div>
  );
}
