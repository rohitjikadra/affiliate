type AmazonPriceDisclaimerProps = {
  className?: string;
};

export function AmazonPriceDisclaimer({ className = "mt-2 text-xs leading-5 text-neutral-600" }: AmazonPriceDisclaimerProps) {
  return (
    <p className={className}>
      Product prices and availability are accurate as of the date/time indicated and are subject to change. Any
      price and availability information displayed on Amazon.in at the time of purchase will apply to the purchase
      of this product.
    </p>
  );
}

export function isAmazonMerchant(
  merchant: { slug?: string | null; network?: string | null } | string | null | undefined,
): boolean {
  if (!merchant) {
    return false;
  }
  if (typeof merchant === "string") {
    const value = merchant.trim().toLowerCase();
    return value === "amazon" || value === "amazon_in";
  }
  return merchant.slug === "amazon" || merchant.network === "AMAZON";
}

export function hasAssociatesWording(text: string | null | undefined): boolean {
  return Boolean(text && /amazon associate/i.test(text));
}
