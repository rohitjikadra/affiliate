import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/guides/GuideBody";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { ProductCard } from "@/components/home/ProductCard";
import { getGuide } from "@/lib/api";
import { ApiError } from "@/types/product";
import type { Metadata } from "next";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { handleMoved } from "@/lib/redirects";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const guide = await getGuide(slug);
    return publicMetadata({
      title: guide.seoTitle ?? guide.title,
      description: guide.seoDescription ?? guide.excerpt,
      path: `/guides/${guide.slug}`,
    });
  } catch (error) {
    handleMoved(error, "/guides");
    return publicMetadata({ title: "Guide", path: `/guides/${slug}` });
  }
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;

  try {
    const guide = await getGuide(slug);
    if (guide.kind === "BEST_OF") {
      const { redirect } = await import("next/navigation");
      redirect(`/best/${guide.slug}`);
    }

    return (
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <TrackPageView path={`/guides/${guide.slug}`} entityType="guide" entityId={guide.id} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              articleJsonLd({
                title: guide.title,
                description: guide.excerpt,
                path: `/guides/${guide.slug}`,
                dateModified: guide.updatedAt,
              }),
            ),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              breadcrumbJsonLd([
                { name: "Home", path: "/" },
                { name: "Guides", path: "/guides" },
                { name: guide.title, path: `/guides/${guide.slug}` },
              ]),
            ),
          }}
        />
        <div className="rounded-md bg-white px-5 py-8 sm:px-8">
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="px-2">/</span>
            <Link href="/guides" className="hover:text-navy">Guides</Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold text-navy">{guide.title}</h1>
          {guide.excerpt ? <p className="mt-3 text-base text-neutral-600">{guide.excerpt}</p> : null}
          <p className="mt-2 text-xs text-neutral-500">Updated {new Date(guide.updatedAt).toLocaleDateString("en-IN")}</p>
          <div className="mt-6">
            <GuideBody body={guide.body} />
          </div>
          {guide.products.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-navy">Related products</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {guide.products.map((item) => (
                  <ProductCard key={item.id} product={item.product} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </article>
    );
  } catch (error) {
    handleMoved(error, "/guides");
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
