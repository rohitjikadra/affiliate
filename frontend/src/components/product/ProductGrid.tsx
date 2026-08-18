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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">{emptyTitle}</p>
        {emptyDescription ? <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
