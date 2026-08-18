import Link from "next/link";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { ApiStatus } from "@/components/home/ApiStatus";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p>© {new Date().getFullYear()} AffiliateHub</p>
          <AffiliateNotice className="mt-2 max-w-xl text-sm leading-6 text-slate-500" />
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Link href="/affiliate-disclosure" className="font-medium text-teal-700 hover:text-teal-800">
            Affiliate disclosure
          </Link>
          <ApiStatus />
        </div>
      </div>
    </footer>
  );
}
