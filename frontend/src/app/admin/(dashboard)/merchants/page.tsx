import Link from "next/link";
import { listMerchants } from "@/lib/api";

export default async function AdminMerchantsPage() {
  const merchants = await listMerchants();

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{merchants.length} merchants</p>
        <Link href="/admin/merchants/create" className="text-sm font-semibold text-navy hover:underline">
          Add merchant
        </Link>
      </div>
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Network</th>
              <th className="px-4 py-3">Offers</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant.id} className="border-t border-neutral-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/merchants/${merchant.id}/edit`} className="font-medium hover:text-navy">
                    {merchant.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{merchant.network ?? merchant.kind}</td>
                <td className="px-4 py-3">{merchant.offerCount ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
