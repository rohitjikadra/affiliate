import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProduct, getAdminConfig, listCategories } from "@/lib/api";
import { ApiError } from "@/types/product";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  try {
    const [product, categories, config] = await Promise.all([
      getProduct(id),
      listCategories(),
      getAdminConfig(),
    ]);

    return (
      <section>
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Edit product</h2>
        <ProductForm
          mode="edit"
          product={product}
          categories={categories}
          amazonAssociateTag={config.amazonAssociateTag}
        />
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
