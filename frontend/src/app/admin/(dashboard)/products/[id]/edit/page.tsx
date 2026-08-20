import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { OffersEditor } from "@/components/admin/OffersEditor";
import { getProduct, getAdminConfig, listCategories, listMerchants } from "@/lib/api";
import { ApiError } from "@/types/product";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  try {
    const [product, categories, config, merchants] = await Promise.all([
      getProduct(id),
      listCategories(),
      getAdminConfig(),
      listMerchants(),
    ]);

    return (
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-navy">Edit product</h2>
        <ProductForm
          mode="edit"
          product={product}
          categories={categories}
          amazonAssociateTag={config.amazonAssociateTag}
        />
        <OffersEditor
          productId={product.id}
          productSlug={product.slug}
          offers={product.offers ?? []}
          merchants={merchants}
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
