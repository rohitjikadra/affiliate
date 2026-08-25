import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/types/product";

export function AlternativeProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="product-section">
      <h2 className="product-section-title mb-4">Alternatives</h2>
      <ProductGrid products={products} emptyTitle="" emptyDescription="" />
    </section>
  );
}
