import { notFound } from "next/navigation";
import { GuideForm } from "@/components/admin/GuideForm";
import { getGuide, listCategories } from "@/lib/api";
import { ApiError } from "@/types/product";

type EditGuidePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditGuidePage({ params }: EditGuidePageProps) {
  const { id } = await params;

  try {
    const [guide, categories] = await Promise.all([getGuide(id), listCategories()]);

    return (
      <section>
        <h2 className="mb-6 text-xl font-semibold text-navy">Edit guide</h2>
        <GuideForm mode="edit" guide={guide} categories={categories} />
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
