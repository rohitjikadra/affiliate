import { GuideForm } from "@/components/admin/GuideForm";
import { listCategories } from "@/lib/api";

export default async function CreateGuidePage() {
  const categories = await listCategories();

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-navy">Create guide</h2>
      <GuideForm mode="create" categories={categories} />
    </section>
  );
}
