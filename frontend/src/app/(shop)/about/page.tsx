import type { Metadata } from "next";
import Link from "next/link";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "About",
  description: "AffiliateHub is a product discovery catalog, not an online store.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-md bg-white px-5 py-8 sm:px-8">
        <p className="text-sm text-neutral-500">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="px-2">/</span>
          <span>About</span>
        </p>
        <h1 className="mt-4 text-3xl font-bold text-navy">About AffiliateHub</h1>
        <div className="mt-6 space-y-6 text-base leading-7 text-neutral-700">
          <p>
            AffiliateHub helps you choose kitchen appliances for Indian homes — mixer grinders, air fryers,
            induction cooktops, kettles, and similar countertop products — before you buy. We are a catalog, not a
            store. We do not hold stock or take payment.
          </p>
          <p>
            When you click <strong>Buy Now</strong> or <strong>View on Amazon</strong>, you leave this site and
            complete the purchase with a retailer such as Amazon. Some of those links are affiliate links. If you
            buy after clicking, we may earn a commission. The price you pay does not change because of that.
          </p>
          <p>
            Listings are editorial. Prices can go stale. Always check the retailer page for the live price, stock,
            and delivery terms. Read our{" "}
            <Link href="/affiliate-disclosure" className="font-medium text-navy underline">
              affiliate disclosure
            </Link>{" "}
            for how commissions work.
          </p>
        </div>
      </div>
    </article>
  );
}
