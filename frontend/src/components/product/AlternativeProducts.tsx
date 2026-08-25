import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types/product";

export function AlternativeProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-6">
      <h2 className="product-section-title mb-3">Alternatives</h2>
      <ProductGrid products={products} emptyTitle="" emptyDescription="" />
    </section>
  );
}
