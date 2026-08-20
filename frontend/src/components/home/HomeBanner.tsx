import Link from "next/link";
import type { Product } from "@/types/product";

type HomeBannerProps = {
  product?: Product;
};

export function HomeBanner({ product }: HomeBannerProps) {
  if (!product) {
    return (
      <section className="rounded-md bg-navy px-5 py-8 text-white sm:px-8">
        <p className="text-sm text-white/70">Today&apos;s picks</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Kitchen appliance recommendations for Indian homes</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Mixer grinders, air fryers, induction cooktops, and kettles — with honest trade-offs, then a tracked Amazon offer.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex rounded-full bg-cta px-5 py-2 text-sm font-bold text-navy hover:bg-cta-hover"
        >
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md bg-navy text-white md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="px-5 py-8 sm:px-8">
        <p className="text-sm text-white/70">Today&apos;s picks</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{product.title}</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Read the review, compare similar kitchen appliances, then check the live price on Amazon.
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="mt-5 inline-flex rounded-full bg-cta px-5 py-2 text-sm font-bold text-navy hover:bg-cta-hover"
        >
          View product
        </Link>
      </div>
      <div className="hidden bg-white md:block">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-full max-h-72 w-full object-contain p-6" />
        ) : (
          <div className="flex h-full min-h-56 items-center justify-center text-6xl font-semibold text-navy">
            {product.title.charAt(0)}
          </div>
        )}
      </div>
    </section>
  );
}
