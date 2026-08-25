import { OpsDashboard } from "@/components/admin/OpsDashboard";
import { getOpsJobs, getOpsOffers, getOpsOverview } from "@/lib/api";

export default async function AdminOpsPage() {
  const [overview, offers, jobs] = await Promise.all([getOpsOverview(), getOpsOffers("stale"), getOpsJobs()]);

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-navy">Operations</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Worker queue, stale fetches, and snapshot retention. Prices refresh in a second Node process, not on page
          requests.
        </p>
      </div>
      <OpsDashboard initialOverview={overview} initialOffers={offers} initialJobs={jobs} />
    </section>
  );
}
