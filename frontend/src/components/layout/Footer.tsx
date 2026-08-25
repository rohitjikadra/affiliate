import Link from "next/link";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { SITE_CATEGORY_FOOTER_LABEL, SITE_CATEGORY_SLUG, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-auto bg-forest-2 text-white">
      <div className="shop-wrap grid gap-10 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-semibold">{SITE_NAME}</p>
          <p className="mt-2 text-sm leading-6 text-white/70">{SITE_TAGLINE}</p>
          <AffiliateNotice className="mt-4 text-xs leading-5 text-white/65 [&_a]:text-white [&_a]:underline" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            <li>
              <Link href="/products" className="hover:text-white">
                All products
              </Link>
            </li>
            <li>
              <Link href="/guides" className="hover:text-white">
                Buying guides
              </Link>
            </li>
            <li>
              <Link href="/compare" className="hover:text-white">
                Compare
              </Link>
            </li>
            <li>
              <Link href="/best" className="hover:text-white">
                Best of
              </Link>
            </li>
            <li>
              <Link href={`/categories/${SITE_CATEGORY_SLUG}`} className="hover:text-white">
                {SITE_CATEGORY_FOOTER_LABEL}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/affiliate-disclosure" className="hover:text-white">
                Affiliate disclosure
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {SITE_NAME}. Some links are affiliate links. We may earn a commission.
      </div>
    </footer>
  );
}
