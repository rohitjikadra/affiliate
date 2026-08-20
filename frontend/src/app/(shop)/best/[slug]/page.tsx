import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GuideBody } from "@/components/guides/GuideBody";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { ProductCard } from "@/components/home/ProductCard";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { ScoreBadge } from "@/components/product/StarRating";
import { getGuide } from "@/lib/api";
import { ApiError } from "@/types/product";
import type { Metadata } from "next";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { articleJsonLd } from "@/lib/json-ld";
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

const badgeLabel: Record<string, string> = {
  BEST_OVERALL: "Best overall",
  BEST_BUDGET: "Best budget",
  BEST_PREMIUM: "Best premium",
  BEST_FOR_BEGINNERS: "Best for beginners",
  RELATED: "Also consider",
};

export default async function BestPage({ params }: BestPageProps) {
  const { slug } = await params;

  try {
    const guide = await getGuide(slug);
    if (guide.kind !== "BEST_OF") {
      redirect(`/guides/${guide.slug}`);
    }

    return (
      <article className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
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
        <div className="rounded-md bg-white px-5 py-8 sm:px-8">
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="px-2">/</span>
            <Link href="/guides" className="hover:text-navy">Guides</Link>
          </p>
          <h1 className="mt-4 text-3xl font-bold text-navy">{guide.title}</h1>
          {guide.excerpt ? <p className="mt-3 text-base text-neutral-600">{guide.excerpt}</p> : null}
          {guide.methodology ? (
            <p className="mt-4 rounded-md bg-neutral-50 p-3 text-sm text-neutral-700">
              <strong>How we rank:</strong> {guide.methodology}
            </p>
          ) : null}
          <div className="mt-6">
            <GuideBody body={guide.body} />
          </div>
          <ol className="mt-8 space-y-4">
            {guide.products.map((item) => (
              <li key={item.id} className="rounded-md border border-neutral-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy">
                  {badgeLabel[item.badge] ?? item.badge}
                </p>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/products/${item.product.slug}`} className="text-lg font-semibold text-navy">
                      {item.product.title}
                    </Link>
                    {item.product.ourScore ? <ScoreBadge score={Number(item.product.ourScore)} className="mt-2" /> : null}
                    {item.notes ? <p className="mt-2 text-sm text-neutral-600">{item.notes}</p> : null}
                  </div>
                  <BuyNowButton
                    offerId={item.product.primaryOfferId}
                    merchantName={item.product.store}
                    available={item.product.available}
                  />
                </div>
                <div className="mt-4 max-w-xs">
                  <ProductCard product={item.product} />
                </div>
              </li>
            ))}
          </ol>
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
