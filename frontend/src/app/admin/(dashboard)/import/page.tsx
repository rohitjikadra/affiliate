import { ImportForm } from "@/components/admin/ImportForm";
import { getAdminConfig, listCategories } from "@/lib/api";

export default async function AdminImportPage() {
  const [categories, config] = await Promise.all([listCategories(), getAdminConfig()]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-navy">Amazon ASIN Import</h2>
      <p className="mt-1 mb-6 text-sm text-neutral-500">
        Paste Amazon ASINs or search Amazon. Matches reuse the existing product by ASIN. New rows stay Draft until you
        publish.
      </p>
      <ImportForm categories={categories} creatorsConfigured={config.creatorsConfigured} />
    </section>
  );
}
