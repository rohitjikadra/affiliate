import Link from "next/link";

type AffiliateNoticeProps = {
  className?: string;
};

export function AffiliateNotice({ className = "mt-4 text-sm leading-6 text-neutral-600" }: AffiliateNoticeProps) {
  return (
    <p className={className}>
      As an Amazon Associate, AffiliateHub may earn from qualifying purchases.{" "}
      <Link href="/affiliate-disclosure" className="font-medium text-navy underline">
        Affiliate disclosure
      </Link>
    </p>
  );
}
