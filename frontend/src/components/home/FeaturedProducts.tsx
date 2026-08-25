import Link from "next/link";
import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/product/ProductGrid";

type FeaturedProductsProps = {
  products: Product[];
  title?: string;
};

export function FeaturedProducts({ products, title = "Shop kitchen appliances" }: FeaturedProductsProps) {
  return (
    <section id="featured" className="scroll-mt-24 rounded-md bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <p className="mt-0.5 text-sm text-neutral-600">Tap a product to see prices, scores, and who should skip it.</p>
        </div>
        <Link href="/products" className="shrink-0 text-sm font-medium text-navy hover:underline">
          See all
        </Link>
      </div>
      <ProductGrid
        products={products}
        emptyTitle="No products yet."
        emptyDescription="Add a product in admin, or check back after import."
      />
    </section>
  );
}
