type BuyNowButtonProps = {
  offerId?: string | null;
  merchantName?: string;
  available: boolean;
  sticky?: boolean;
};

export function BuyNowButton({ offerId, merchantName, available, sticky = false }: BuyNowButtonProps) {
  if (!available || !offerId) {
    return (
      <p className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        This offer is currently unavailable.
      </p>
    );
  }

  const label = merchantName ? `Check price on ${merchantName}` : "Check current price";

  return (
    <div className={sticky ? "fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white p-3 sm:static sm:border-0 sm:p-0" : ""}>
      <a
        href={`/go/${offerId}`}
        rel="nofollow sponsored"
        className="inline-flex w-full items-center justify-center rounded-full bg-cta px-6 py-3 text-base font-bold text-navy hover:bg-cta-hover sm:w-auto sm:min-w-52"
      >
        {label}
      </a>
    </div>
  );
}
