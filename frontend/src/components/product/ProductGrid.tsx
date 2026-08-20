import type { Product } from "@/types/product";
import { ProductCard } from "@/components/home/ProductCard";

type ProductGridProps = {
  products: Product[];
  emptyTitle: string;
  emptyDescription?: string;
};

export function ProductGrid({ products, emptyTitle, emptyDescription }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-800">{emptyTitle}</p>
        {emptyDescription ? <p className="mt-1 text-sm text-neutral-500">{emptyDescription}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
