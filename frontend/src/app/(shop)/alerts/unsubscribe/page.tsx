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
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-md bg-white px-5 py-8 sm:px-8">
        <h1 className="text-3xl font-bold text-navy">{ok ? "Unsubscribed" : "Could not unsubscribe"}</h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">{message}</p>
        <p className="mt-6 text-sm">
          <Link href="/privacy" className="font-medium text-navy underline">
            Privacy
          </Link>
        </p>
      </div>
    </article>
  );
}
