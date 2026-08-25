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
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-md bg-white px-5 py-8 sm:px-8">
        <h1 className="text-3xl font-bold text-navy">{ok ? "Alert confirmed" : "Could not confirm"}</h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">{message}</p>
        <p className="mt-6 text-sm">
          <Link href="/products" className="font-medium text-navy underline">
            Browse products
          </Link>
        </p>
      </div>
    </article>
  );
}
