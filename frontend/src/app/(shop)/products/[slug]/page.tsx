import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { ScoreBadge } from "@/components/product/StarRating";
import { ProductGallery } from "@/components/media/ProductGallery";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProduct } from "@/lib/api";
import { discountPercent, formatMoney, formatOptionalMoney } from "@/lib/money";
import { splitLines } from "@/lib/text";
import { publicMetadata, jsonLd } from "@/lib/seo";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/json-ld";
import { handleMoved } from "@/lib/redirects";
import { ApiError } from "@/types/product";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return publicMetadata({
      title: product.seoTitle ?? product.title,
      description: product.seoDescription ?? product.description,
      path: `/products/${product.slug}`,
      image: product.imageUrl,
    });
  } catch (error) {
    handleMoved(error, "/products");
    return publicMetadata({ title: "Product", path: `/products/${slug}` });
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);
    if (!product.isActive) {
      notFound();
    }

    const price = product.price != null ? Number(product.price) : null;
    const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
    const showOriginal =
      price !== null && originalPrice !== null && !Number.isNaN(originalPrice) && originalPrice > price;
    const off = showOriginal && price !== null && originalPrice !== null ? discountPercent(price, originalPrice) : null;
    const formattedPrice = formatOptionalMoney(product.price, product.currency);
    const score = product.ourScore ? Number(product.ourScore) : null;
    const pros = splitLines(product.pros);
    const cons = splitLines(product.cons);
    const faqPairs = (product.faq ?? "")
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    const primary = product.offers.find((offer) => offer.isPrimary) ?? product.offers[0];
    const breadcrumbs = [
      { name: "Home", path: "/" },
      ...(product.category ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }] : []),
      { name: product.title, path: `/products/${product.slug}` },
    ];
    const faq = faqJsonLd(product.faq);

    return (
      <article className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:pb-10">
        <TrackPageView path={`/products/${product.slug}`} entityType="product" entityId={product.id} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, `/products/${product.slug}`)) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(breadcrumbs)) }} />
        {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} /> : null}
        <p className="text-sm text-neutral-500">
          <Link href="/" className="hover:text-navy">Home</Link>
          {product.category ? (
            <>
              <span className="px-2">/</span>
              <Link href={`/categories/${product.category.slug}`} className="hover:text-navy">
                {product.category.name}
              </Link>
            </>
          ) : null}
        </p>

        <div className="mt-4 grid gap-6 bg-white p-4 sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <ProductGallery images={product.images ?? []} alt={product.title} />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{product.title}</h1>
            {product.brand ? <p className="mt-1 text-sm font-medium text-neutral-600">{product.brand}</p> : null}
            <p className="mt-2 text-sm text-neutral-500">
              Offers from {product.offers.map((offer) => offer.merchant.name).join(", ") || product.store}
            </p>
            {score !== null && !Number.isNaN(score) ? <ScoreBadge score={score} className="mt-3" /> : null}
            <p className="mt-2 text-xs text-neutral-500">Our Score is editorial, not a customer or Amazon rating.</p>
            {product.scoreBreakdown.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-neutral-700">
                {product.scoreBreakdown.map((item) => (
                  <li key={item.label} className="flex justify-between gap-4">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4">
              {off ? <p className="text-sm font-medium text-red-700">-{off}%</p> : null}
              {formattedPrice ? (
                <p className="text-3xl font-semibold text-neutral-900">{formattedPrice}</p>
              ) : (
                <p className="text-lg font-semibold text-neutral-900">Check price on Amazon</p>
              )}
              {showOriginal && originalPrice !== null ? (
                <p className="text-sm text-neutral-500">
                  Was <span className="line-through">{formatMoney(originalPrice, product.currency)}</span>
                </p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-500">
                {product.lastCheckedAt
                  ? `Price last checked ${new Date(product.lastCheckedAt).toLocaleDateString("en-IN")}`
                  : `Page updated ${new Date(product.updatedAt).toLocaleDateString("en-IN")}`}
              </p>
              {product.warranty ? <p className="mt-2 text-sm text-neutral-700"><strong>Warranty:</strong> {product.warranty}</p> : null}
            </div>
            {product.bestFor ? <p className="mt-4 text-sm text-neutral-700"><strong>Best for:</strong> {product.bestFor}</p> : null}
            {product.description ? <p className="mt-4 text-sm leading-6 text-neutral-700">{product.description}</p> : null}
            <div className="mt-5">
              <BuyNowButton
                offerId={primary?.id ?? product.primaryOfferId}
                merchantName={primary?.merchant.name ?? product.store}
                available={product.available}
                sticky
              />
              <AffiliateNotice className="mt-3 hidden text-sm text-neutral-600 sm:block" />
            </div>
          </div>
        </div>

        {product.specs.length > 0 ? (
          <div className="mt-6 rounded-md bg-white p-4">
            <h2 className="font-semibold text-navy">Key specifications</h2>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              {product.specs.map((item) => (
                <div key={item.label} className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm">
                  <dt className="text-neutral-500">{item.label}</dt>
                  <dd className="font-medium text-neutral-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        {product.offers.length > 0 ? (
          <div className="mt-6 rounded-md bg-white p-4">
            <h2 className="font-semibold text-navy">Available merchants</h2>
            <ul className="mt-3 divide-y divide-neutral-100">
              {product.offers.map((offer) => (
                <li key={offer.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-neutral-900">{offer.merchant.name}</p>
                    {offer.title ? <p className="text-xs text-neutral-500">{offer.title}</p> : null}
                  </div>
                  <div className="text-right">
                    {offer.price ? <p className="font-semibold">{formatMoney(Number(offer.price), offer.currency)}</p> : <p className="text-sm text-neutral-500">Check price on Amazon</p>}
                    <BuyNowButton offerId={offer.id} merchantName={offer.merchant.name} available={offer.available} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {pros.length > 0 || cons.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {pros.length > 0 ? (
              <div className="rounded-md bg-white p-4">
                <h2 className="font-semibold text-navy">Pros</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {pros.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            {cons.length > 0 ? (
              <div className="rounded-md bg-white p-4">
                <h2 className="font-semibold text-navy">Cons</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {cons.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {faqPairs.length > 1 ? (
          <div className="mt-6 rounded-md bg-white p-4">
            <h2 className="font-semibold text-navy">FAQ</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {Array.from({ length: Math.floor(faqPairs.length / 2) }, (_, index) => (
                <div key={faqPairs[index * 2]}>
                  <dt className="font-medium text-neutral-900">{faqPairs[index * 2]}</dt>
                  <dd className="mt-1 text-neutral-700">{faqPairs[index * 2 + 1]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        {product.relatedGuides && product.relatedGuides.length > 0 ? (
          <div className="mt-6 rounded-md bg-white p-4">
            <h2 className="font-semibold text-navy">Related guides</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {product.relatedGuides.map((guide) => (
                <li key={guide.id}>
                  <Link href={guide.kind === "BEST_OF" ? `/best/${guide.slug}` : `/guides/${guide.slug}`} className="text-navy underline">
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {product.relatedComparisons && product.relatedComparisons.length > 0 ? (
          <div className="mt-6 rounded-md bg-white p-4">
            <h2 className="font-semibold text-navy">Comparisons</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {product.relatedComparisons.map((item) => (
                <li key={item.id}>
                  <Link href={`/compare/${item.slug}`} className="text-navy underline">{item.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {product.relatedProducts && product.relatedProducts.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 font-semibold text-navy">Alternatives</h2>
            <ProductGrid products={product.relatedProducts} emptyTitle="" emptyDescription="" />
          </div>
        ) : null}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd({
          title: product.title,
          description: product.description,
          path: `/products/${product.slug}`,
          dateModified: product.updatedAt,
        })) }} />
      </article>
    );
  } catch (error) {
    handleMoved(error, "/products");
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
