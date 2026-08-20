"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/admin/LogoutButton";

const links = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/guides", label: "Guides" },
  { href: "/admin/comparisons", label: "Comparisons" },
  { href: "/admin/merchants", label: "Merchants" },
  { href: "/admin/stats", label: "Analytics" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#eaeded]">
      <aside className="hidden w-56 shrink-0 bg-navy text-white md:block">
        <div className="px-4 py-5">
          <Link href="/admin/products" className="text-lg font-bold">
            AffiliateHub
          </Link>
          <p className="mt-1 text-xs text-white/70">Admin</p>
        </div>
        <nav className="flex flex-col px-2">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm ${active ? "bg-white/15 font-semibold" : "text-white/80 hover:bg-white/10"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-6">
          <Link href="/" className="text-xs text-white/70 hover:text-white">
            View shop
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm md:hidden"
            onClick={() => setOpen((current) => !current)}
          >
            Menu
          </button>
          <p className="hidden text-sm font-medium text-navy md:block">Dashboard</p>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products/create"
              className="rounded-full bg-cta px-4 py-2 text-sm font-bold text-navy hover:bg-cta-hover"
            >
              Add product
            </Link>
            <LogoutButton />
          </div>
        </header>
        {open ? (
          <nav className="flex flex-col gap-1 border-b border-neutral-200 bg-navy px-3 py-3 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
