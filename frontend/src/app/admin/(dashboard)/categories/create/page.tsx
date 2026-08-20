import { CategoryForm } from "@/components/admin/CategoryForm";

export default function CreateCategoryPage() {
  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-navy">Create category</h2>
      <CategoryForm mode="create" />
    </section>
  );
}
