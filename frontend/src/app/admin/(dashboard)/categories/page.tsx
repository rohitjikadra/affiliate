import Link from "next/link";
import { CategoryTable } from "@/components/admin/CategoryTable";
import { listCategories } from "@/lib/api";

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-500">{categories.length} categories</p>
        <Link href="/admin/categories/create" className="text-sm font-semibold text-navy hover:underline">
          Add category
        </Link>
      </div>
      <CategoryTable initialCategories={categories} />
    </section>
  );
}
