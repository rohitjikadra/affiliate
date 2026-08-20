"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/guides", label: "Guides" },
  { href: "/categories/kitchen-appliances", label: "Kitchen" },
];

type SiteHeaderProps = {
  isAdmin: boolean;
  defaultQuery?: string;
};

export function SiteHeader({ isAdmin, defaultQuery = "" }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30">
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
            AffiliateHub
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
              placeholder="Search mixers, air fryers, kettles"
              className="h-10 w-full rounded-l-md border-0 bg-white px-3 text-sm text-neutral-900 outline-none"
            />
            <button
              type="submit"
              className="h-10 rounded-r-md bg-search px-4 text-sm font-bold text-navy hover:bg-search-hover"
            >
              Search
            </button>
          </form>

          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/30 md:hidden"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="sr-only">Menu</span>
            <span className="flex flex-col gap-1">
              <span className="block h-0.5 w-4 bg-white" />
              <span className="block h-0.5 w-4 bg-white" />
              <span className="block h-0.5 w-4 bg-white" />
            </span>
          </button>
        </div>

        <form action="/products" method="get" className="flex px-4 pb-2.5 md:hidden">
          <input
            type="search"
            name="q"
            defaultValue={defaultQuery}
            placeholder="Search mixers, air fryers, kettles"
            className="h-10 w-full rounded-l-md border-0 bg-white px-3 text-sm text-neutral-900 outline-none"
          />
          <button
            type="submit"
            className="h-10 rounded-r-md bg-search px-3 text-sm font-bold text-navy hover:bg-search-hover"
          >
            Go
          </button>
        </form>
      </div>

      <nav className="hidden bg-navy-2 text-sm text-white md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-2 sm:px-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link href="/admin/products" className="hover:underline">
              Admin
            </Link>
          ) : null}
        </div>
      </nav>

      {open ? (
        <nav className="flex flex-col bg-navy-2 px-4 py-2 text-sm text-white md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="py-2" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link href="/admin/products" className="py-2" onClick={() => setOpen(false)}>
              Admin
            </Link>
          ) : null}
        </nav>
      ) : null}

      <p className="border-b border-neutral-200 bg-[#eaeded] px-4 py-1.5 text-center text-xs text-neutral-700 sm:px-6">
        As an Amazon Associate we earn from qualifying purchases.{" "}
        <Link href="/affiliate-disclosure" className="font-medium text-navy underline">
          Affiliate disclosure
        </Link>
      </p>
    </header>
  );
}
