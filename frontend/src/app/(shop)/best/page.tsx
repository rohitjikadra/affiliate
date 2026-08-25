import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { HomeGuideCard } from "@/components/home/HomeGuideCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { listGuides } from "@/lib/api";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = publicMetadata({
  title: "Best kitchen appliances",
  description: "Best-of roundups for mixer grinders, air fryers, and other kitchen appliances for Indian homes.",
  path: "/best",
});

export const revalidate = 120;

export default async function BestIndexPage() {
  try {
    const { items } = await listGuides({ kind: "BEST_OF", limit: 50 });

    return (
      <div className="shop-wrap py-6 sm:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: "Best of", path: "/best" },
              ]),
            ),
          }}
        />
        <Breadcrumb items={[{ name: "Home", href: "/" }, { name: "Best of" }]} />
        <header className="mt-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Best kitchen appliances
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            Editorial shortlists for Indian homes.{" "}
            <Link href="/guides" className="font-medium text-forest underline">
              All guides
            </Link>{" "}
            for longer buying advice.
          </p>
        </header>
        {items.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-line bg-surface px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink">No best-of lists published yet.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <HomeGuideCard guide={item} />
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
