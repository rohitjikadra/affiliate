import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

type AffiliateNoticeProps = {
  className?: string;
};

export function AffiliateNotice({ className = "mt-4 text-sm leading-6 text-neutral-600" }: AffiliateNoticeProps) {
  return (
    <p className={className}>
      Some links on {SITE_NAME} are affiliate links. We may earn a commission if you buy after clicking. This does not
      change the price you pay.{" "}
      <Link href="/affiliate-disclosure" className="font-medium text-forest underline decoration-forest/30 underline-offset-2">
        Affiliate disclosure
      </Link>
    </p>
  );
}

export function AmazonAssociatesNotice({ className = "mt-2 text-xs leading-5 text-ink-subtle" }: AffiliateNoticeProps) {
  return (
    <p className={className}>
      {SITE_NAME} is a participant in the Amazon Associates Programme. As an Amazon Associate we earn from qualifying
      purchases.
    </p>
  );
}
