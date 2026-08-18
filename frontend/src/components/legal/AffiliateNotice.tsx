import Link from "next/link";

type AffiliateNoticeProps = {
  className?: string;
};

export function AffiliateNotice({ className = "mt-4 text-sm leading-6 text-slate-500" }: AffiliateNoticeProps) {
  return (
    <p className={className}>
      As an Amazon Associate, AffiliateHub may earn from qualifying purchases.{" "}
      <Link href="/affiliate-disclosure" className="font-medium text-teal-700 hover:text-teal-800">
        Affiliate disclosure
      </Link>
    </p>
  );
}
