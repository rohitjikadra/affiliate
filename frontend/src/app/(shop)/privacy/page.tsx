import type { Metadata } from "next";
import Link from "next/link";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Privacy",
  description: "How AffiliateHub uses cookies, hashed click logs, and page views — without storing raw IPs or emails.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-md bg-white px-5 py-8 sm:px-8">
        <p className="text-sm text-neutral-500">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="px-2">/</span>
          <span>Privacy</span>
        </p>
        <h1 className="mt-4 text-3xl font-bold text-navy">Privacy</h1>
        <div className="mt-6 space-y-8 text-base leading-7 text-neutral-700">
          <section>
            <h2 className="text-xl font-semibold text-navy">What we collect</h2>
            <p className="mt-3">
              AffiliateHub is a catalog. We do not create shopper accounts on this site. When you browse, your
              browser may send standard request data to our hosting provider. We do not store raw IP addresses
              in our application database.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy">Cookies</h2>
            <p className="mt-3">
              We set a session cookie (<code>ah_session</code>) only after an admin signs in to manage the
              catalog. Public visitors do not need that cookie. Retailers such as Amazon may set their own
              cookies after you click an affiliate link. Those cookies are controlled by the retailer, not by us.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy">Page views and affiliate clicks</h2>
            <p className="mt-3">
              Product, guide, comparison, and category pages may record a page view (path, optional entity id,
              referrer, and UTM campaign parameters). We do not attach that event to a person.
            </p>
            <p className="mt-3">
              When you click Buy Now, we record that the click happened: product, merchant, offer, time,
              optional referrer, truncated user agent, a coarse device class, landing path, and UTM fields.
              Instead of your IP address we store a short HMAC hash that rotates daily. We do not store your
              name, email, or payment details. After the click, Amazon or another retailer may track the visit
              for their affiliate programme.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy">Contact messages</h2>
            <p className="mt-3">
              The contact form opens your own email app. If you send a message, we receive whatever you put in
              that email. We do not run a mail API on this site and we do not store contact-form submissions.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy">More detail</h2>
            <p className="mt-3">
              How commissions work is explained on the{" "}
              <Link href="/affiliate-disclosure" className="font-medium text-navy underline">
                affiliate disclosure
              </Link>{" "}
              page.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
