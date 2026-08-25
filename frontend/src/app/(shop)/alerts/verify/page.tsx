import type { Metadata } from "next";
import Link from "next/link";
import { confirmPriceAlert } from "@/lib/api";
import { publicMetadata } from "@/lib/seo";
import { ApiError } from "@/types/product";

type VerifyPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const metadata: Metadata = publicMetadata({
  title: "Confirm price alert",
  description: "Confirm a kitchen appliance price alert.",
  path: "/alerts/verify",
  noIndex: true,
});

export default async function VerifyAlertPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;
  let ok = false;
  let message = "This confirmation link is missing or invalid.";

  if (token && token.length >= 10) {
    try {
      await confirmPriceAlert(token);
      ok = true;
      message = "Your price alert is confirmed. We will email you when it matches.";
    } catch (error) {
      message =
        error instanceof ApiError && error.status === 404
          ? "This confirmation link is expired or already used."
          : "We could not confirm this alert. Try the link from your email again.";
    }
  }

  return (
    <article className="shop-wrap py-10 sm:py-14">
      <div className="product-section mx-auto max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Price alert</p>
        <h1 className="font-display mt-2 text-2xl font-semibold text-ink">
          {ok ? "Alert confirmed" : "Could not confirm"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">{message}</p>
        <p className="mt-6">
          <Link href="/products" className="text-sm font-semibold text-forest underline">
            Browse products
          </Link>
        </p>
      </div>
    </article>
  );
}
