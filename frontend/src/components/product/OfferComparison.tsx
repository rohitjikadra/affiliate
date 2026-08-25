import { OfferLegalNotes } from "@/components/legal/OfferLegalNotes";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";
import { ProductSection } from "@/components/product/ProductSection";
import { discountPercent, formatMoney } from "@/lib/money";
import {
  availabilityLabel,
  currentBestOffer,
  formatOfferPrice,
  numericOfferPrice,
  sortOffersForDisplay,
} from "@/lib/offers";
import type { Offer, Product } from "@/types/product";

type OfferComparisonProps = {
  product: Product;
};

export function OfferComparison({ product }: OfferComparisonProps) {
  const offers = product.offers;
  if (offers.length === 0) {
    return null;
  }

  const best = currentBestOffer(product);
  const ranked = sortOffersForDisplay(offers, best?.id);
  const others = ranked.filter((offer) => offer.id !== best?.id);

  return (
    <ProductSection id="offers" title={best ? "Best price" : "Current offers"}>
      {best ? <BestOfferCard offer={best} /> : (
        <p className="mt-2 text-sm text-ink-muted">
          No fresh in-stock price is available right now. You can still compare merchant offers below.
        </p>
      )}

      {best && others.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink">Compare prices</h3>
          <ul className="mt-3 divide-y divide-line">
            {ranked.map((offer) => (
              <OfferRow key={offer.id} offer={offer} isBest={offer.id === best.id} />
            ))}
          </ul>
        </div>
      ) : null}

      {!best ? (
        <ul className="mt-4 divide-y divide-line">
          {ranked.map((offer) => (
            <OfferRow key={offer.id} offer={offer} isBest={false} />
          ))}
        </ul>
      ) : null}
    </ProductSection>
  );
}

function BestOfferCard({ offer }: { offer: Offer }) {
  const priceLabel = formatOfferPrice(offer.price, offer.currency);
  const original = numericOfferPrice(offer.originalPrice);
  const current = numericOfferPrice(offer.price);
  const off = current != null && original != null ? discountPercent(current, original) : null;

  return (
    <div className="mt-4 rounded-md border border-forest/20 bg-forest-soft px-4 py-5 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest">Best price</p>
      {offer.isPrimary ? (
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Recommended</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {priceLabel ? (
            <p className="font-display text-4xl font-semibold tabular-nums tracking-tight text-ink">{priceLabel}</p>
          ) : (
            <p className="text-lg font-semibold text-ink">Check price on {offer.merchant.name}</p>
          )}
          {off && original != null ? (
            <p className="mt-1 text-sm text-ink-muted">
              <span className="line-through">{formatMoney(original, offer.currency, 0)}</span>
              <span className="ml-2 font-medium text-forest">-{off}%</span>
            </p>
          ) : null}
          <p className="mt-2 text-sm font-medium text-ink">{offer.merchant.name}</p>
          {offer.title ? <p className="text-xs text-ink-subtle">{offer.title}</p> : null}
          <p className="mt-1 text-sm text-ink-muted">{availabilityLabel(offer)}</p>
          <FreshnessBadge level={offer.freshness} label={offer.freshnessLabel} className="mt-2" />
        </div>
        <BuyNowButton offerId={offer.id} merchantName={offer.merchant.name} available={offer.available} />
      </div>
      <OfferLegalNotes merchant={offer.merchant} className="mt-4 max-w-2xl text-xs leading-5 text-ink-subtle" />
    </div>
  );
}

function OfferRow({ offer, isBest }: { offer: Offer; isBest: boolean }) {
  const priceLabel = formatOfferPrice(offer.price, offer.currency);
  const stale = offer.freshness === "stale" || !offer.available;

  return (
    <li
      className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-3 ${
        isBest ? "rounded-md bg-forest-soft sm:py-4" : ""
      } ${stale && !isBest ? "opacity-80" : ""}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-ink">
          {offer.merchant.name}
          {isBest ? <span className="ml-2 text-xs font-semibold text-forest">Best current price</span> : null}
          {offer.isPrimary ? <span className="ml-2 text-xs font-semibold text-ink-muted">Recommended</span> : null}
        </p>
        {offer.title ? <p className="text-xs text-ink-subtle">{offer.title}</p> : null}
        <p className="mt-1 text-xs text-ink-muted">{availabilityLabel(offer)}</p>
        <FreshnessBadge level={offer.freshness} label={offer.freshnessLabel} className="mt-1" />
        {!isBest ? (
          <OfferLegalNotes merchant={offer.merchant} className="mt-1 max-w-md text-xs leading-5 text-ink-subtle" />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:text-right">
        {priceLabel ? (
          <p className={`text-lg font-semibold tabular-nums ${stale ? "text-ink-muted" : "text-ink"}`}>{priceLabel}</p>
        ) : (
          <p className="text-sm text-ink-muted">Price unavailable</p>
        )}
        <BuyNowButton offerId={offer.id} merchantName={offer.merchant.name} available={offer.available} compact />
      </div>
    </li>
  );
}
