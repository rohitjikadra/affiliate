import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { listComparisons } from "@/lib/api";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";

export const metadata: Metadata = publicMetadata({
  title: "Compare kitchen appliances",
  description: "Side-by-side comparisons of mixer grinders, air fryers, and other kitchen appliances for Indian homes.",
  path: "/compare",
});

export const revalidate = 120;

export default async function CompareIndexPage() {
  try {
    const { items } = await listComparisons({ limit: 50 });

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: "Compare", path: "/compare" },
              ]),
            ),
          }}
        />
        <div className="rounded-md bg-white px-4 py-5 sm:px-6">
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="px-2">/</span>
            <span>Compare</span>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">Compare kitchen appliances</h1>
          <p className="mt-1 text-sm text-neutral-600">Editorial side-by-sides. Prices come from merchant offers on each product page.</p>
        </div>
        {items.length === 0 ? (
          <div className="mt-4 rounded-md bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-neutral-700">No comparisons published yet.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/compare/${item.slug}`}
                  className="block h-full rounded-md border border-neutral-200 bg-white p-5 hover:border-navy"
                >
                  <h2 className="text-lg font-semibold text-navy">{item.title}</h2>
                  {item.excerpt ? <p className="mt-2 text-sm leading-6 text-neutral-600">{item.excerpt}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } catch {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <CatalogUnavailable />
      </div>
    );
  }
}
