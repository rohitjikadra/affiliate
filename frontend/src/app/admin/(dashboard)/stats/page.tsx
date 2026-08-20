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
        <h2 className="text-xl font-semibold text-navy">Click stats</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Outbound clicks, page views, and CTR. Earnings still come from merchant reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Last 7 days" value={stats.totals.last7Days} />
        <StatCard label="Last 30 days" value={stats.totals.last30Days} />
        <StatCard label="All clicks" value={stats.totals.all} />
        <StatCard label="Page views" value={stats.totals.pageViews} />
        <StatCard label="Views (7d)" value={stats.totals.pageViewsLast7Days} />
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-navy">Clicks by product</h3>
        </div>
        {stats.products.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">No products yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">7d</th>
                  <th className="px-4 py-3">30d</th>
                  <th className="px-4 py-3">All</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">CTR</th>
                </tr>
              </thead>
              <tbody>
                {stats.products.map((product) => (
                  <tr key={product.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="font-medium text-neutral-900 hover:text-navy"
                      >
                        {product.title}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {product.source}
                        {product.isActive ? "" : " · Inactive"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{product.clicks.last7Days}</td>
                    <td className="px-4 py-3 text-neutral-700">{product.clicks.last30Days}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{product.clicks.all}</td>
                    <td className="px-4 py-3 text-neutral-700">{product.pageViews}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {product.ctr == null ? "—" : `${(product.ctr * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SimpleTable
          title="Clicks by merchant"
          empty="No merchant clicks yet."
          rows={stats.merchants.map((merchant) => [merchant.name, String(merchant.clicks)])}
          headers={["Merchant", "Clicks"]}
        />
        <SimpleTable
          title="Top landing pages"
          empty="No page views yet."
          rows={stats.topPages.map((page) => [page.path, String(page.views)])}
          headers={["Path", "Views"]}
        />
        <SimpleTable
          title="UTM sources"
          empty="No campaign clicks yet."
          rows={stats.campaigns.map((campaign) => [campaign.source, String(campaign.clicks)])}
          headers={["Source", "Clicks"]}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-navy">Recent clicks</h3>
        </div>
        {stats.recent.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            No clicks yet. Open a product and use Buy Now to record one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Landing</th>
                  <th className="px-4 py-3">UTM</th>
                  <th className="px-4 py-3">From</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((click) => (
                  <tr key={click.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                      {formatWhen(click.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/products/${click.product.slug}`} className="hover:text-navy">
                        {click.product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{click.merchant?.name ?? click.source}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-neutral-500">{click.landingPath ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {[click.utmSource, click.utmCampaign].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-neutral-500" title={click.referrer ?? ""}>
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
    <div className="rounded-md border border-neutral-200 bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-navy">{value}</p>
    </div>
  );
}

function SimpleTable({
  title,
  empty,
  headers,
  rows,
}: {
  title: string;
  empty: string;
  headers: [string, string];
  rows: [string, string][];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-neutral-500">{empty}</p>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">{headers[0]}</th>
              <th className="px-4 py-3">{headers[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([left, right]) => (
              <tr key={left} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">{left}</td>
                <td className="px-4 py-2 text-neutral-600">{right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
