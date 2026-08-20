import Link from "next/link";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";

export function Footer() {
  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-bold">AffiliateHub</p>
          <p className="mt-2 text-sm text-white/70">
            Kitchen appliance recommendations for Indian homes. We send you to Amazon through tracked affiliate offers.
          </p>
          <AffiliateNotice className="mt-3 text-xs leading-5 text-white/70 [&_a]:text-white [&_a]:underline" />
        </div>
        <div>
          <p className="text-sm font-semibold">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/products" className="hover:underline">
                All products
              </Link>
            </li>
            <li>
              <Link href="/guides" className="hover:underline">
                Buying guides
              </Link>
            </li>
            <li>
              <Link href="/categories/kitchen-appliances" className="hover:underline">
                Kitchen appliances
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/affiliate-disclosure" className="hover:underline">
                Affiliate disclosure
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} AffiliateHub. Some links are affiliate links. We may earn a commission.
      </div>
    </footer>
  );
}
