import type { Metadata } from "next";
import Link from "next/link";
import { publicMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: "Affiliate disclosure",
  description: `How ${SITE_NAME} discloses affiliate relationships when you click through to a merchant.`,
  path: "/affiliate-disclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-md bg-white px-5 py-8 sm:px-8">
        <p className="text-sm text-neutral-500">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="px-2">/</span>
          <span>Affiliate disclosure</span>
        </p>
        <h1 className="mt-4 text-3xl font-bold text-navy">Affiliate disclosure</h1>
        <p className="mt-4 text-base leading-7 text-neutral-700">
          This page explains how {SITE_NAME} may earn money when you click a product link and later buy something.
          Please read it before you treat any page as a shopping list.
        </p>

        <div className="mt-8 space-y-8 text-base leading-7 text-neutral-700">
          <section>
            <h2 className="text-xl font-semibold text-navy">What this website is</h2>
            <p className="mt-3">
              {SITE_NAME} is a product discovery catalog. We do not sell inventory from this site, hold stock, or
              process checkout. When you click <strong>Check price</strong>, you leave {SITE_NAME} and go to a
              merchant to complete the purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy">How we may earn a commission</h2>
            <p className="mt-3">
              Some of our links are affiliate links. If you click one and later buy a product, the merchant may pay
              us a commission. This does not change the price you pay. We may also use tracking cookies set by the
              merchant after you click.
            </p>
          </section>

          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <p>
              <strong>Amazon Associates:</strong> {SITE_NAME} is a participant in the Amazon Associates Programme,
              an affiliate advertising programme designed to provide a means for sites to earn advertising fees by
              advertising and linking to Amazon.in.{" "}
              <strong>As an Amazon Associate we earn from qualifying purchases.</strong> This Amazon-specific wording
              also appears next to Amazon offers on product pages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy">How we choose products</h2>
            <p className="mt-3">
              Listings are based on publicly available information, typical buyer needs, and editorial judgment.
              Unless an article clearly says otherwise, we do not claim that every product has been personally
              lab-tested or used long-term by {SITE_NAME}. A commission is never the only reason a product type
              appears in the catalog.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy">Prices</h2>
            <p className="mt-3">
              Prices shown on {SITE_NAME} are catalog snapshots recorded on this site. Each offer is labelled with how
              recently it was checked. Prices and availability can change. Confirm the live price on the merchant page
              before you buy. For Amazon offers, the price and availability on Amazon.in at the time of purchase apply
              to that purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy">Merchant disclosures</h2>
            <p className="mt-3">
              Where a merchant has its own disclosure text, we show it next to that merchant’s offer. Amazon
              Associates wording is not used as a site-wide default for other merchants.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
