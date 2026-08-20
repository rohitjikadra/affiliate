import { notFound } from "next/navigation";
import { ComparisonForm } from "@/components/admin/ComparisonForm";
import { getComparison, listProducts } from "@/lib/api";
import { ApiError } from "@/types/product";

export default async function EditComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const [comparison, listed] = await Promise.all([
      getComparison((await params).id),
      listProducts({ includeInactive: true, limit: 100 }),
    ]);
    return (
      <section>
        <h2 className="mb-6 text-xl font-semibold text-navy">Edit comparison</h2>
        <ComparisonForm comparison={comparison} products={listed.items} />
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
