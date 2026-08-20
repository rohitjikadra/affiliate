import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategory } from "@/lib/api";
import { ApiError } from "@/types/product";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  try {
    const category = await getCategory(id);

    return (
      <section>
        <h2 className="mb-6 text-xl font-semibold text-navy">Edit category</h2>
        <CategoryForm mode="edit" category={category} />
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
