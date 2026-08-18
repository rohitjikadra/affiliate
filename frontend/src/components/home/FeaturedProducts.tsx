import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/product/ProductGrid";

type FeaturedProductsProps = {
  products: Product[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section id="featured" className="scroll-mt-24">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Picks</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Featured products
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Independent picks with Amazon affiliate links. We may earn a commission if you buy.
        </p>
      </div>
      <ProductGrid
        products={products}
        emptyTitle="No featured products yet."
        emptyDescription="Add a featured product in admin, or browse the full catalog."
      />
    </section>
  );
}
