import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { HomeComparisonCard } from "@/components/home/HomeComparisonCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
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
      <div className="shop-wrap py-6 sm:py-10">
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
        <Breadcrumb items={[{ name: "Home", href: "/" }, { name: "Compare" }]} />
        <header className="mt-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Compare kitchen appliances
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Editorial side-by-sides. Current prices come from eligible merchant offers — not leftover catalog figures.
          </p>
        </header>
        {items.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink">No comparisons published yet.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <HomeComparisonCard comparison={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  } catch {
    return (
      <div className="shop-wrap py-10">
        <CatalogUnavailable />
      </div>
    );
  }
}
