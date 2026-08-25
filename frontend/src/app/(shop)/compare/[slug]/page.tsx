import { notFound } from "next/navigation";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { CompareView } from "@/components/compare/CompareView";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getComparison } from "@/lib/api";
import { ApiError } from "@/types/product";
import type { Metadata } from "next";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { handleMoved } from "@/lib/redirects";

type ComparePageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const comparison = await getComparison(slug);
    return publicMetadata({
      title: comparison.seoTitle ?? comparison.title,
      description: comparison.seoDescription ?? comparison.excerpt,
      path: `/compare/${comparison.slug}`,
    });
  } catch (error) {
    handleMoved(error, "/compare");
    return publicMetadata({ title: "Comparison", path: `/compare/${slug}` });
  }
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { slug } = await params;

  try {
    const comparison = await getComparison(slug);
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: "Compare", path: "/compare" },
      { name: comparison.title, path: `/compare/${comparison.slug}` },
    ];

    return (
      <article className="shop-wrap py-6 sm:py-10">
        <TrackPageView path={`/compare/${comparison.slug}`} entityType="comparison" entityId={comparison.id} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              articleJsonLd({
                title: comparison.title,
                description: comparison.excerpt,
                path: `/compare/${comparison.slug}`,
                dateModified: comparison.updatedAt,
              }),
            ),
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(breadcrumbs)) }} />
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Compare", href: "/compare" },
            { name: comparison.title },
          ]}
        />
        <div className="mt-6">
          <CompareView comparison={comparison} />
        </div>
      </article>
    );
  } catch (error) {
    handleMoved(error, "/compare");
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
