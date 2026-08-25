import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/legal/ContactForm";
import { contactEmail } from "@/lib/contact";
import { publicMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: "Contact",
  description: `How to reach ${SITE_NAME} about the catalog, guides, or affiliate links.`,
  path: "/contact",
});

export default function ContactPage() {
  const email = contactEmail();

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-md bg-white px-5 py-8 sm:px-8">
        <p className="text-sm text-neutral-500">
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
          <span className="px-2">/</span>
          <span>Contact</span>
        </p>
        <h1 className="mt-4 text-3xl font-bold text-navy">Contact</h1>
        {email ? (
          <>
            <p className="mt-4 text-base leading-7 text-neutral-700">
              Questions about a listing, a guide, or how our affiliate links work? Email{" "}
              <a href={`mailto:${email}`} className="font-medium text-navy underline">
                {email}
              </a>{" "}
              or use the form below. We do not process orders or refunds — those stay with the retailer.
            </p>
            <ContactForm email={email} />
          </>
        ) : (
          <p className="mt-4 text-base leading-7 text-neutral-700">
            Set <code>NEXT_PUBLIC_CONTACT_EMAIL</code> in the frontend environment to show a public contact
            address. We do not process orders or refunds — those stay with the retailer.
          </p>
        )}
      </div>
    </article>
  );
}
