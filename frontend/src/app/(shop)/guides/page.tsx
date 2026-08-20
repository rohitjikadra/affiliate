import Link from "next/link";
import { CatalogUnavailable } from "@/components/catalog/CatalogUnavailable";
import { listGuides } from "@/lib/api";
import { publicMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = publicMetadata({
  title: "Buying guides",
  description: "Editorial buying guides and best-of roundups before you click a merchant offer.",
  path: "/guides",
});

export const revalidate = 120;

export default async function GuidesPage() {
  try {
    const { items: guides } = await listGuides({ limit: 50 });

    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="rounded-md bg-white px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-navy">Buying guides</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Kitchen appliance recommendations for Indian homes.
          </p>
        </div>

        {guides.length === 0 ? (
          <div className="mt-4 rounded-md bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-neutral-700">No guides published yet.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.id}>
                <Link
                  href={guide.kind === "BEST_OF" ? `/best/${guide.slug}` : `/guides/${guide.slug}`}
                  className="block h-full rounded-md border border-neutral-200 bg-white p-5 hover:border-navy"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {guide.kind === "BEST_OF" ? "Best of" : guide.category?.name ?? "Guide"}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-navy">{guide.title}</h2>
                  {guide.excerpt ? <p className="mt-2 text-sm leading-6 text-neutral-600">{guide.excerpt}</p> : null}
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
