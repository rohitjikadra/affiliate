import { ComparisonForm } from "@/components/admin/ComparisonForm";
import { listProducts } from "@/lib/api";

export default async function CreateComparisonPage() {
  const { items } = await listProducts({ includeInactive: true, limit: 100 });
  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold text-navy">Create comparison</h2>
      <ComparisonForm products={items} />
    </section>
  );
}
