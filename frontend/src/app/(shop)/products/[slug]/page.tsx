import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { isAmazonMerchant } from "@/components/legal/AmazonPriceDisclaimer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TrackPageView } from "@/components/analytics/TrackPageView";
import { AlertForm } from "@/components/product/AlertForm";
import { AlternativeProducts } from "@/components/product/AlternativeProducts";
import { AnalysisSection } from "@/components/product/AnalysisSection";
import { BestForCard } from "@/components/product/BestForCard";
import { FaqAccordion } from "@/components/product/FaqAccordion";
import { FeatureList } from "@/components/product/FeatureList";
import { OfferComparison } from "@/components/product/OfferComparison";
import { PriceHistorySection } from "@/components/product/PriceHistorySection";
import { ProductHero } from "@/components/product/ProductHero";
import { ProsCons } from "@/components/product/ProsCons";
import { QuickSpecs } from "@/components/product/QuickSpecs";
import { RelatedContent } from "@/components/product/RelatedContent";
import { SpecificationsTable } from "@/components/product/SpecificationsTable";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { WhoShouldAvoid } from "@/components/product/WhoShouldAvoid";
import { getProduct } from "@/lib/api";
import { formatOfferPrice, checkoutOffer, currentBestOffer, numericOfferPrice } from "@/lib/offers";
import { parseFaq, splitLines } from "@/lib/text";
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
    if (!product.isActive || product.status !== "PUBLISHED") {
      notFound();
    }

    const best = currentBestOffer(product);
    const checkout = checkoutOffer(product);
    const price = best ? numericOfferPrice(best.price) : null;
    const formattedPrice = best ? formatOfferPrice(best.price, best.currency) : null;
    const features = splitLines(product.features);
    const pros = splitLines(product.pros);
    const cons = splitLines(product.cons);
    const faqItems = parseFaq(product.faq);
    const breadcrumbs = [
      { name: "Home", path: "/" },
      ...(product.category ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }] : []),
      { name: product.title, path: `/products/${product.slug}` },
    ];
    const faq = faqJsonLd(product.faq);
    const showsAmazon = product.offers.some((offer) => isAmazonMerchant(offer.merchant.slug));

    return (
      <article className="shop-wrap py-6 pb-28 sm:pb-32">
        <TrackPageView path={`/products/${product.slug}`} entityType="product" entityId={product.id} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, `/products/${product.slug}`)) }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(breadcrumbs)) }} />
        {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} /> : null}

        <Breadcrumb
          items={breadcrumbs.map((item, index) =>
            index === breadcrumbs.length - 1 ? { name: item.name } : { name: item.name, href: item.path },
          )}
        />

        <ProductHero product={product} />
        <QuickSpecs specs={product.specs} />
        <OfferComparison product={product} />
        <PriceHistorySection productSlug={product.slug} showAmazonDisclaimer={showsAmazon} />
        <AlertForm productId={product.id} currentPrice={price} />
        <AnalysisSection description={product.description} />
        <ProsCons pros={pros} cons={cons} />
        <FeatureList features={features} />
        <SpecificationsTable specs={product.specs} />
        <BestForCard bestFor={product.bestFor} />
        <WhoShouldAvoid whoShouldAvoid={product.whoShouldAvoid} />
        <AlternativeProducts products={product.relatedProducts ?? []} />
        <RelatedContent guides={product.relatedGuides} comparisons={product.relatedComparisons} />
        <FaqAccordion items={faqItems} />

        <AffiliateNotice className="mt-8 text-sm leading-6 text-ink-muted sm:hidden" />

        <StickyBuyBar
          offerId={checkout?.id}
          merchantName={checkout?.merchant.name ?? product.store}
          available={Boolean(checkout?.available)}
          priceLabel={formattedPrice}
          freshnessLevel={best?.freshness ?? checkout?.freshness ?? product.freshness}
          freshnessLabel={best?.freshnessLabel ?? checkout?.freshnessLabel ?? product.freshnessLabel}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(
              articleJsonLd({
                title: product.title,
                description: product.description,
                path: `/products/${product.slug}`,
                dateModified: product.updatedAt,
              }),
            ),
          }}
        />
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
