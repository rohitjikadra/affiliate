import Link from "next/link";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/guides/GuideBody";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { ScoreBadge } from "@/components/product/StarRating";
import { getComparison } from "@/lib/api";
import { formatOptionalMoney } from "@/lib/money";
import { ApiError } from "@/types/product";
import type { Metadata } from "next";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { articleJsonLd } from "@/lib/json-ld";
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

    return (
      <article className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
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
        <div className="rounded-md bg-white px-5 py-8 sm:px-8">
          <p className="text-sm text-neutral-500">
            <Link href="/" className="hover:text-navy">Home</Link>
            <span className="px-2">/</span>
            <span>Compare</span>
          </p>
          <h1 className="mt-4 text-3xl font-bold text-navy">{comparison.title}</h1>
          {comparison.excerpt ? <p className="mt-3 text-base text-neutral-600">{comparison.excerpt}</p> : null}
          {comparison.winner ? (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-neutral-800">
              <strong>Our pick:</strong>{" "}
              <Link href={`/products/${comparison.winner.slug}`} className="text-navy underline">
                {comparison.winner.title}
              </Link>
            </p>
          ) : null}
          {comparison.methodology ? (
            <p className="mt-3 text-sm text-neutral-600">
              <strong>How we compared:</strong> {comparison.methodology}
            </p>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 pr-4"> </th>
                  {comparison.items.map((item) => (
                    <th key={item.id} className="px-3 py-2">
                      <Link href={`/products/${item.product.slug}`} className="text-navy">
                        {item.product.title}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <th className="py-2 pr-4 font-medium">Our Score</th>
                  {comparison.items.map((item) => (
                    <td key={`${item.id}-score`} className="px-3 py-2">
                      {item.product.ourScore ? <ScoreBadge score={Number(item.product.ourScore)} /> : "—"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-100">
                  <th className="py-2 pr-4 font-medium">Price</th>
                  {comparison.items.map((item) => (
                    <td key={`${item.id}-price`} className="px-3 py-2">
                      {formatOptionalMoney(item.product.price, item.product.currency) ?? "Check price on Amazon"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-100">
                  <th className="py-2 pr-4 font-medium">Best for</th>
                  {comparison.items.map((item) => (
                    <td key={`${item.id}-best`} className="px-3 py-2 text-neutral-700">
                      {item.product.bestFor ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th className="py-2 pr-4 font-medium">Offer</th>
                  {comparison.items.map((item) => (
                    <td key={`${item.id}-cta`} className="px-3 py-2">
                      <BuyNowButton
                        offerId={item.product.primaryOfferId}
                        merchantName={item.product.store}
                        available={item.product.available}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <GuideBody body={comparison.body} />
          </div>
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
