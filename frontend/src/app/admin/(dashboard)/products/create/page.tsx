import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminConfig, listCategories } from "@/lib/api";

export default async function CreateProductPage() {
  const [categories, config] = await Promise.all([listCategories(), getAdminConfig()]);

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-navy">Create product</h2>
      <ProductForm mode="create" categories={categories} amazonAssociateTag={config.amazonAssociateTag} />
    </section>
  );
}
