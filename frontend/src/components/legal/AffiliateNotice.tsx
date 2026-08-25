import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

type AffiliateNoticeProps = {
  className?: string;
};

export function AffiliateNotice({ className = "mt-4 text-sm leading-6 text-neutral-600" }: AffiliateNoticeProps) {
  return (
    <p className={className}>
      As an Amazon Associate, {SITE_NAME} may earn from qualifying purchases.{" "}
      <Link href="/affiliate-disclosure" className="font-medium text-forest underline decoration-forest/30 underline-offset-2">
        Affiliate disclosure
      </Link>
    </p>
  );
}
