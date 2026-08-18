import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyNowButton } from "@/components/product/BuyNowButton";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import { getProduct } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/types/product";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);

    if (!product.isActive) {
      notFound();
    }

    const price = Number(product.price);
    const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
    const showOriginal = originalPrice !== null && !Number.isNaN(originalPrice) && originalPrice > price;
    const rating = product.rating ? Number(product.rating) : null;

    return (
      <article className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.title}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-teal-700 text-7xl font-semibold text-white">
                {product.title.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              {product.category ? (
                <Link href={`/categories/${product.category.slug}`} className="hover:text-teal-800">
                  {product.category.name}
                </Link>
              ) : (
                "Catalog"
              )}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {product.title}
            </h1>
            <p className="mt-3 text-sm text-slate-500">Sold by {product.store}</p>

            {rating !== null && !Number.isNaN(rating) ? (
              <p className="mt-4 text-sm font-medium text-slate-700">★ {rating.toFixed(1)} / 5</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-3xl font-semibold text-slate-900">
                {formatMoney(price, product.currency)}
              </p>
              {showOriginal ? (
                <p className="text-lg text-slate-400 line-through">
                  {formatMoney(originalPrice, product.currency)}
                </p>
              ) : null}
            </div>

            {product.description ? (
              <p className="mt-6 text-base leading-7 text-slate-600">{product.description}</p>
            ) : null}

            <div className="mt-8">
              <BuyNowButton slug={product.slug} available={product.available} />
              <AffiliateNotice />
            </div>
          </div>
        </div>
      </article>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
