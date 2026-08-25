"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { useState } from "react";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/guides", label: "Guides" },
  { href: "/compare", label: "Compare" },
  { href: "/categories/kitchen-appliances", label: "Kitchen" },
];

type SiteHeaderProps = {
  isAdmin: boolean;
  defaultQuery?: string;
};

function navActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ isAdmin, defaultQuery = "" }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="shop-wrap">
        <div className="flex items-center gap-4 py-3">
          <Link href="/" className="font-display shrink-0 text-lg font-semibold tracking-tight text-forest">
            {SITE_NAME}
          </Link>

          <form action="/products" method="get" className="hidden min-w-0 flex-1 md:flex">
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <input
              id="header-search"
              type="search"
              name="q"
              defaultValue={defaultQuery}
              placeholder="Search Prestige, Philips, mixer grinders"
              className="h-10 w-full rounded-l-md border border-line bg-paper px-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-forest"
            />
            <button
              type="submit"
              className="h-10 rounded-r-md bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-2"
            >
              Search
            </button>
          </form>

          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1">
              <span className={`block h-0.5 w-4 bg-ink transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-4 bg-ink transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-4 bg-ink transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>

        <form action="/products" method="get" className="flex pb-3 md:hidden">
          <label htmlFor="header-search-mobile" className="sr-only">
            Search products
          </label>
          <input
            id="header-search-mobile"
            type="search"
            name="q"
            defaultValue={defaultQuery}
            placeholder="Search Prestige, Philips, mixer grinders"
            className="h-10 w-full rounded-l-md border border-line bg-paper px-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-forest"
          />
          <button
            type="submit"
            className="h-10 rounded-r-md bg-forest px-3 text-sm font-semibold text-white hover:bg-forest-2"
          >
            Search
          </button>
        </form>

        <nav className="hidden border-t border-line md:block" aria-label="Primary">
          <div className="flex items-center gap-6 py-2.5 text-sm">
            {navItems.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "font-medium text-forest" : "text-ink-muted hover:text-forest"}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link href="/admin/products" className="ml-auto text-ink-muted hover:text-forest">
                Admin
              </Link>
            ) : null}
          </div>
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-line bg-surface px-4 py-2 text-sm md:hidden" aria-label="Primary">
          {navItems.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2.5 ${active ? "font-medium text-forest" : "text-ink"}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          {isAdmin ? (
            <Link href="/admin/products" className="block py-2.5 text-ink" onClick={() => setOpen(false)}>
              Admin
            </Link>
          ) : null}
        </nav>
      ) : null}

      <p className="border-t border-line bg-paper px-4 py-1.5 text-center text-xs text-ink-muted sm:px-6">
        As an Amazon Associate we earn from qualifying purchases.{" "}
        <Link href="/affiliate-disclosure" className="font-medium text-forest underline decoration-forest/30 underline-offset-2">
          Affiliate disclosure
        </Link>
      </p>
    </header>
  );
}
