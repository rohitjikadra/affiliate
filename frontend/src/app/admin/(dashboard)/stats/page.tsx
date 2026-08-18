import Link from "next/link";
import { getClickStats } from "@/lib/api";

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function hostFromReferrer(referrer: string | null): string {
  if (!referrer) {
    return "Direct";
  }

  try {
    return new URL(referrer).host || referrer;
  } catch {
    return referrer;
  }
}

export default async function AdminStatsPage() {
  const stats = await getClickStats();

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Click stats</h2>
        <p className="mt-1 text-sm text-slate-500">
          Buy Now clicks recorded before the shopper is sent to Amazon or Flipkart.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Last 7 days" value={stats.totals.last7Days} />
        <StatCard label="Last 30 days" value={stats.totals.last30Days} />
        <StatCard label="All time" value={stats.totals.all} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Clicks by product</h3>
        </div>
        {stats.products.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">7d</th>
                  <th className="px-4 py-3">30d</th>
                  <th className="px-4 py-3">All</th>
                </tr>
              </thead>
              <tbody>
                {stats.products.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-medium text-slate-900 hover:text-teal-800"
                      >
                        {product.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {product.source}
                        {product.isActive ? "" : " · Inactive"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{product.clicks.last7Days}</td>
                    <td className="px-4 py-3 text-slate-700">{product.clicks.last30Days}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{product.clicks.all}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Recent clicks</h3>
        </div>
        {stats.recent.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            No clicks yet. Open a product and use Buy Now to record one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">From</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((click) => (
                  <tr key={click.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatWhen(click.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/products/${click.product.slug}`} className="hover:text-teal-800">
                        {click.product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{click.source}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-500" title={click.referrer ?? ""}>
                      {hostFromReferrer(click.referrer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
