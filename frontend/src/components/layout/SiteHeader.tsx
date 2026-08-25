"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { Suspense, useState } from "react";

const navItems = [
  { href: "/products", label: "Products" },
  { href: "/guides", label: "Guides" },
  { href: "/compare", label: "Compare" },
  { href: "/categories/kitchen-appliances", label: "Kitchen" },
];

function HeaderSearchForm({
  inputId,
  className,
  buttonClassName,
}: {
  inputId: string;
  className: string;
  buttonClassName: string;
}) {
  const query = useSearchParams().get("q") ?? "";

  return (
    <form action="/products" method="get" role="search" className={className}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        key={query}
        type="search"
        name="q"
        defaultValue={query}
        autoComplete="search"
        enterKeyHint="search"
        spellCheck={false}
        placeholder="Search Prestige, Philips, mixer grinders"
        className="h-10 w-full rounded-l-md border border-line bg-paper px-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-forest"
      />
      <button type="submit" className={buttonClassName}>
        Search
      </button>
    </form>
  );
}

function HeaderSearchFallback({
  inputId,
  className,
  buttonClassName,
}: {
  inputId: string;
  className: string;
  buttonClassName: string;
}) {
  return (
    <form action="/products" method="get" role="search" className={className}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        autoComplete="search"
        enterKeyHint="search"
        placeholder="Search Prestige, Philips, mixer grinders"
        className="h-10 w-full rounded-l-md border border-line bg-paper px-3 text-sm text-ink outline-none placeholder:text-ink-subtle focus:border-forest"
      />
      <button type="submit" className={buttonClassName}>
        Search
      </button>
    </form>
  );
}

function navActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SiteHeaderProps = {
  isAdmin: boolean;
};

const desktopSearchClass = "hidden min-w-0 flex-1 md:flex";
const mobileSearchClass = "flex pb-3 md:hidden";
const desktopButtonClass = "h-10 rounded-r-md bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-2";
const mobileButtonClass = "h-10 rounded-r-md bg-forest px-3 text-sm font-semibold text-white hover:bg-forest-2";

export function SiteHeader({ isAdmin }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="shop-wrap">
        <div className="flex items-center gap-4 py-3">
          <Link href="/" className="font-display shrink-0 text-lg font-semibold tracking-tight text-forest">
            {SITE_NAME}
          </Link>

          <Suspense
            fallback={
              <HeaderSearchFallback
                inputId="header-search"
                className={desktopSearchClass}
                buttonClassName={desktopButtonClass}
              />
            }
          >
            <HeaderSearchForm
              inputId="header-search"
              className={desktopSearchClass}
              buttonClassName={desktopButtonClass}
            />
          </Suspense>

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

        <Suspense
          fallback={
            <HeaderSearchFallback
              inputId="header-search-mobile"
              className={mobileSearchClass}
              buttonClassName={mobileButtonClass}
            />
          }
        >
          <HeaderSearchForm
            inputId="header-search-mobile"
            className={mobileSearchClass}
            buttonClassName={mobileButtonClass}
          />
        </Suspense>

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
