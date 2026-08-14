import Link from "next/link";
import { ProductTable } from "@/components/admin/ProductTable";
import { listProducts } from "@/lib/api";

export default async function AdminProductsPage() {
  const products = await listProducts();

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">{products.length} products in the catalog</p>
        <Link href="/admin/products/create" className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          Add product
        </Link>
      </div>
      <ProductTable initialProducts={products} />
    </section>
  );
}
