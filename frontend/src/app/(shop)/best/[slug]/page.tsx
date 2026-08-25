import { notFound, redirect } from "next/navigation";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { BestOfView } from "@/components/best/BestOfView";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getGuide } from "@/lib/api";
import { ApiError } from "@/types/product";
import type { Metadata } from "next";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/json-ld";
import { handleMoved } from "@/lib/redirects";

type BestPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: BestPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const guide = await getGuide(slug);
    return publicMetadata({
      title: guide.seoTitle ?? guide.title,
      description: guide.seoDescription ?? guide.excerpt,
      path: `/best/${guide.slug}`,
    });
  } catch (error) {
    handleMoved(error, "/best");
    return publicMetadata({ title: "Best of", path: `/best/${slug}` });
  }
}

export default async function BestPage({ params }: BestPageProps) {
  const { slug } = await params;

  try {
    const guide = await getGuide(slug);
    if (guide.kind !== "BEST_OF") {
      redirect(`/guides/${guide.slug}`);
    }
    const breadcrumbs = [
      { name: "Home", path: "/" },
      { name: "Best of", path: "/best" },
      { name: guide.title, path: `/best/${guide.slug}` },
    ];

    return (
      <article className="shop-wrap py-6 sm:py-10">
        <TrackPageView path={`/best/${guide.slug}`} entityType="best" entityId={guide.id} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              articleJsonLd({
                title: guide.title,
                description: guide.excerpt,
                path: `/best/${guide.slug}`,
                dateModified: guide.updatedAt,
              }),
            ),
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(breadcrumbs)) }} />
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Best of", href: "/best" },
            { name: guide.title },
          ]}
        />
        <div className="mt-6">
          <BestOfView guide={guide} />
        </div>
      </article>
    );
  } catch (error) {
    handleMoved(error, "/best");
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
