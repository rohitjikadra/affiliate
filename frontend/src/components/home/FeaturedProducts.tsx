import Link from "next/link";
import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/product/ProductGrid";

type FeaturedProductsProps = {
  products: Product[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section id="featured" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Featured kitchen picks</h2>
        <Link href="/affiliate-disclosure" className="text-xs text-neutral-600 underline">
          Affiliate disclosure
        </Link>
      </div>
      <ProductGrid
        products={products}
        emptyTitle="No featured products yet."
        emptyDescription="Add a featured product in admin, or browse the full catalog."
      />
    </section>
  );
}
