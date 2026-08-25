import Link from "next/link";
import { getAdminAlerts } from "@/lib/api";

function formatWhen(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function typeLabel(type: string): string {
  if (type === "TARGET_PRICE") {
    return "Target price";
  }
  if (type === "PERCENT_DROP") {
    return "Percent drop";
  }
  if (type === "NEW_LOW") {
    return "New low";
  }
  return type;
}

export default async function AdminAlertsPage() {
  const alerts = await getAdminAlerts();

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-navy">Price alerts</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {alerts.length} latest alerts. Token hashes are not shown.
        </p>
      </div>
      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        {alerts.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">No price alerts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Triggered</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-800">{alert.email}</td>
                    <td className="px-4 py-3">
                      <Link href={`/products/${alert.product.slug}`} className="font-medium hover:text-navy">
                        {alert.product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{typeLabel(alert.type)}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {alert.type === "TARGET_PRICE" && alert.targetPrice
                        ? `₹${alert.targetPrice}`
                        : alert.type === "PERCENT_DROP" && alert.percentThreshold
                          ? `${alert.percentThreshold}%`
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {!alert.isActive ? "Unsubscribed" : alert.emailVerifiedAt ? "Verified" : "Pending"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{formatWhen(alert.lastTriggeredAt)}</td>
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
