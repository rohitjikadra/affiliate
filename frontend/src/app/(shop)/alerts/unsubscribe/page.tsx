import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribePriceAlert } from "@/lib/api";
import { publicMetadata } from "@/lib/seo";
import { ApiError } from "@/types/product";

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const metadata: Metadata = publicMetadata({
  title: "Unsubscribe from price alerts",
  description: "Stop receiving kitchen appliance price alerts.",
  path: "/alerts/unsubscribe",
  noIndex: true,
});

export default async function UnsubscribeAlertPage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;
  let ok = false;
  let message = "This unsubscribe link is missing or invalid.";

  if (token && token.length >= 10) {
    try {
      await unsubscribePriceAlert(token);
      ok = true;
      message = "You are unsubscribed. We will not send more alerts for this product.";
    } catch (error) {
      message =
        error instanceof ApiError && error.status === 404
          ? "This unsubscribe link is expired or already used."
          : "We could not unsubscribe this alert. Try the link from your email again.";
    }
  }

  return (
    <article className="shop-wrap py-10 sm:py-14">
      <div className="product-section mx-auto max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Price alert</p>
        <h1 className="font-display mt-2 text-2xl font-semibold text-ink">
          {ok ? "Unsubscribed" : "Could not unsubscribe"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">{message}</p>
        <p className="mt-6">
          <Link href="/privacy" className="text-sm font-semibold text-forest underline">
            Privacy
          </Link>
        </p>
      </div>
    </article>
  );
}
