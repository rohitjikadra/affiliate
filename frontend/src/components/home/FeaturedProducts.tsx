import type { Product } from "@/types/catalog";
import { ProductCard } from "@/components/home/ProductCard";

type FeaturedProductsProps = {
  products: Product[];
  query: string;
};

export function FeaturedProducts({ products, query }: FeaturedProductsProps) {
  return (
    <section id="featured" className="scroll-mt-24">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Picks</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          Featured products
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Sample catalog only. Marketplace APIs are not connected yet.
        </p>
      </div>
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-700">No products match “{query}”.</p>
          <p className="mt-1 text-sm text-slate-500">Try another keyword or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
