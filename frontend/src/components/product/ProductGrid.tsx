import type { ReactNode } from "react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

type ProductGridProps = {
  products: Product[];
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

export function ProductGrid({ products, emptyTitle, emptyDescription, emptyAction }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium text-ink">{emptyTitle}</p>
        {emptyDescription ? <p className="mt-2 text-sm leading-6 text-ink-subtle">{emptyDescription}</p> : null}
        {emptyAction ? <div className="mt-5">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
