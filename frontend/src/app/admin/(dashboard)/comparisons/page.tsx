import Link from "next/link";
import { listComparisons } from "@/lib/api";

export default async function AdminComparisonsPage() {
  const { items } = await listComparisons({ includeUnpublished: true, limit: 100 });

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{items.length} comparisons</p>
        <Link href="/admin/comparisons/create" className="text-sm font-semibold text-navy hover:underline">
          Add comparison
        </Link>
      </div>
      <ul className="divide-y divide-neutral-100 rounded-md border border-neutral-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <Link href={`/admin/comparisons/${item.id}/edit`} className="font-medium hover:text-navy">
                {item.title}
              </Link>
              <p className="text-xs text-neutral-500">{item.published ? "Published" : "Draft"}</p>
            </div>
            <Link href={`/compare/${item.slug}`} className="text-xs text-navy underline">
              View
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
