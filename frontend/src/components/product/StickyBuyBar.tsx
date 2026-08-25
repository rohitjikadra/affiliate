"use client";

import { useEffect, useState } from "react";
import { FreshnessBadge } from "@/components/product/FreshnessBadge";
import type { FreshnessLevel } from "@/types/product";

type StickyBuyBarProps = {
  offerId?: string | null;
  merchantName?: string;
  available: boolean;
  priceLabel?: string | null;
  freshnessLevel: FreshnessLevel;
  freshnessLabel: string;
};

export function StickyBuyBar({
  offerId,
  merchantName,
  available,
  priceLabel,
  freshnessLevel,
  freshnessLabel,
}: StickyBuyBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!available || !offerId) {
      return;
    }

    const target = document.getElementById("product-hero-cta");
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [available, offerId]);

  if (!visible || !available || !offerId) {
    return null;
  }

  const label = merchantName ? `Check price on ${merchantName}` : "Check current price";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-hairline backdrop-blur">
      <div className="shop-wrap flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {priceLabel ? <p className="text-base font-semibold tabular-nums text-ink">{priceLabel}</p> : null}
          <FreshnessBadge level={freshnessLevel} label={freshnessLabel} />
        </div>
        <a href={`/go/${offerId}`} rel="nofollow sponsored" className="btn-buy btn-buy-compact w-auto shrink-0">
          {label}
        </a>
      </div>
    </div>
  );
}
