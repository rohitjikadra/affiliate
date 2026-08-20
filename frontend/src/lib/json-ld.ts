import type { Product } from "@/types/product";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export function productJsonLd(product: Product, path: string) {
  const offers = product.offers.filter((offer) => offer.available);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: (product.images?.length ? product.images : product.imageUrl) ?? undefined,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand || SITE_NAME },
    offers:
      offers.length > 1
        ? {
            "@type": "AggregateOffer",
            offerCount: offers.length,
            lowPrice: offers.map((offer) => Number(offer.price)).filter((value) => !Number.isNaN(value)).sort((a, b) => a - b)[0],
            priceCurrency: offers[0]?.currency ?? product.currency,
            offers: offers.map((offer) => ({
              "@type": "Offer",
              price: offer.price ?? undefined,
              priceCurrency: offer.currency,
              availability: offer.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: offer.merchant.name },
              url: absoluteUrl(path),
            })),
          }
        : offers[0]
          ? {
              "@type": "Offer",
              price: offers[0].price ?? product.price ?? undefined,
              priceCurrency: offers[0].currency,
              availability: offers[0].inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: offers[0].merchant.name },
              url: absoluteUrl(path),
            }
          : undefined,
  };
}

export function articleJsonLd(input: { title: string; description?: string | null; path: string; dateModified: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    dateModified: input.dateModified,
    author: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faq: string | null | undefined) {
  if (!faq?.trim()) {
    return null;
  }

  const blocks = faq.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const pairs: { q: string; a: string }[] = [];
  for (let index = 0; index < blocks.length - 1; index += 2) {
    pairs.push({ q: blocks[index], a: blocks[index + 1] });
  }

  if (pairs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.q,
      acceptedAnswer: { "@type": "Answer", text: pair.a },
    })),
  };
}
