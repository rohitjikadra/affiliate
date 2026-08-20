import Link from "next/link";
import { GuideTable } from "@/components/admin/GuideTable";
import { listGuides } from "@/lib/api";

export default async function AdminGuidesPage() {
  const { items: guides } = await listGuides({ includeUnpublished: true, limit: 100 });

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-neutral-500">{guides.length} guides</p>
        <Link href="/admin/guides/create" className="text-sm font-semibold text-navy hover:underline">
          Add guide
        </Link>
      </div>
      <GuideTable initialGuides={guides} />
    </section>
  );
}
