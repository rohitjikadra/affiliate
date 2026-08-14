import { ProductForm } from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/api";

export default async function CreateProductPage() {
  const categories = await listCategories();

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-slate-900">Create product</h2>
      <ProductForm mode="create" categories={categories} />
    </section>
  );
}
