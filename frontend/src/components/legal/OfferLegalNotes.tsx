import { AmazonAssociatesNotice } from "@/components/legal/AffiliateNotice";
import { AmazonPriceDisclaimer, hasAssociatesWording, isAmazonMerchant } from "@/components/legal/AmazonPriceDisclaimer";
import { MerchantDisclosure } from "@/components/legal/MerchantDisclosure";

type MerchantNotes = {
  slug?: string | null;
  network?: string | null;
  disclosure?: string | null;
};

type OfferLegalNotesProps = {
  merchant?: MerchantNotes | null;
  className?: string;
  showPriceDisclaimer?: boolean;
};

export function OfferLegalNotes({
  merchant,
  className = "mt-2 max-w-2xl text-xs leading-5 text-ink-subtle",
  showPriceDisclaimer = true,
}: OfferLegalNotesProps) {
  if (!merchant) {
    return null;
  }

  const amazon = isAmazonMerchant(merchant);
  return (
    <>
      <MerchantDisclosure text={merchant.disclosure} className={className} />
      {amazon && !hasAssociatesWording(merchant.disclosure) ? (
        <AmazonAssociatesNotice className={className} />
      ) : null}
      {amazon && showPriceDisclaimer ? <AmazonPriceDisclaimer className={className} /> : null}
    </>
  );
}
