type BuyNowButtonProps = {
  offerId?: string | null;
  merchantName?: string;
  available: boolean;
  compact?: boolean;
};

export function BuyNowButton({ offerId, merchantName, available, compact = false }: BuyNowButtonProps) {
  if (!available || !offerId) {
    return (
      <p className="rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink-muted">
        This offer is currently unavailable.
      </p>
    );
  }

  const label = merchantName ? `Check price on ${merchantName}` : "Check current price";

  return (
    <a href={`/go/${offerId}`} rel="nofollow sponsored" className={`btn-buy ${compact ? "btn-buy-compact" : ""}`}>
      {label}
    </a>
  );
}
