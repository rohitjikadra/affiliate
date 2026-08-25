"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError } from "@/types/product";
import {
  compactSnapshots,
  getOpsJobs,
  getOpsOffers,
  getOpsOverview,
  refreshOpsOffer,
  retryOpsJob,
  type OpsJob,
  type OpsOffer,
  type OpsOverview,
} from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";

type Freshness = "stale" | "failed" | "queued";

function formatWhen(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function OpsDashboard({
  initialOverview,
  initialOffers,
  initialJobs,
}: {
  initialOverview: OpsOverview;
  initialOffers: OpsOffer[];
  initialJobs: OpsJob[];
}) {
  const [overview, setOverview] = useState(initialOverview);
  const [offers, setOffers] = useState(initialOffers);
  const [jobs, setJobs] = useState(initialJobs);
  const [freshness, setFreshness] = useState<Freshness>("stale");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [compactNote, setCompactNote] = useState("");

  async function withAuth<T>(work: () => Promise<T>): Promise<T | null> {
    setError("");
    try {
      return await work();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin("/admin/ops");
        return null;
      }
      setError(err instanceof ApiError ? err.message : "Could not update ops.");
      return null;
    }
  }

  async function onFilter(next: Freshness) {
    setFreshness(next);
    setPending("filter");
    const data = await withAuth(() => getOpsOffers(next));
    if (data) {
      setOffers(data);
    }
    setPending(null);
  }

  async function onRefreshOffer(id: string) {
    setPending(id);
    const data = await withAuth(() => refreshOpsOffer(id));
    if (data) {
      const [nextOffers, nextOverview] = await Promise.all([getOpsOffers(freshness), getOpsOverview()]);
      setOffers(nextOffers);
      setOverview(nextOverview);
    }
    setPending(null);
  }

  async function onRetry(id: string) {
    setPending(id);
    const data = await withAuth(() => retryOpsJob(id));
    if (data) {
      const [nextJobs, nextOverview] = await Promise.all([getOpsJobs(), getOpsOverview()]);
      setJobs(nextJobs);
      setOverview(nextOverview);
    }
    setPending(null);
  }

  async function onCompact() {
    setPending("compact");
    setCompactNote("");
    const data = await withAuth(() => compactSnapshots());
    if (data) {
      setCompactNote(`Removed ${data.deleted} snapshots older than ${data.retainDays} days (keeps one point per offer per day).`);
      setOverview(await getOpsOverview());
    }
    setPending(null);
  }

  return (
    <div className="space-y-8">
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending jobs" value={overview.pendingJobs} />
        <StatCard label="Dead jobs" value={overview.deadJobs} />
        <StatCard label="Stale offers" value={overview.staleOffers} />
        <StatCard label="Failed offers" value={overview.failedOffers} />
        <StatCard label="Queued fetches" value={overview.queuedOffers} />
        <StatCard label="Verified alerts" value={overview.activeAlerts} />
        <StatCard label="Snapshots" value={overview.snapshotCount} />
        <StatCard label="Price events (24h)" value={overview.priceEventsLast24h} />
      </div>

      <div className="rounded-md border border-neutral-200 bg-white px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Worker</p>
        <p className="mt-2 text-lg font-semibold text-navy">
          {overview.worker.status === "up" ? "Running" : "Not seen"}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Last heartbeat {formatWhen(overview.worker.lastSeenAt)}. Run `npm run worker` as a second Node process.
        </p>
        <button
          type="button"
          disabled={pending === "compact"}
          onClick={() => void onCompact()}
          className="mt-4 rounded-md border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-mist disabled:opacity-60"
        >
          {pending === "compact" ? "Compacting…" : "Compact old snapshots"}
        </button>
        {compactNote ? <p className="mt-2 text-sm text-neutral-600">{compactNote}</p> : null}
      </div>

      <section className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-navy">Offers</h3>
          <div className="flex gap-2">
            {(["stale", "failed", "queued"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={pending === "filter"}
                onClick={() => void onFilter(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  freshness === value ? "bg-navy text-white" : "border border-neutral-200 text-neutral-700 hover:bg-mist"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {offers.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">No offers in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last success</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${offer.product.id}/edit`} className="font-medium hover:text-navy">
                        {offer.product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{offer.merchant.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {offer.fetchStatus}
                      {offer.consecutiveFailures > 0 ? ` · ${offer.consecutiveFailures} fails` : ""}
                      {offer.fetchError ? <p className="max-w-xs truncate text-xs text-red-600">{offer.fetchError}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">{formatWhen(offer.lastSuccessfulFetchAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={pending === offer.id}
                        onClick={() => void onRefreshOffer(offer.id)}
                        className="rounded-md border border-navy px-3 py-1.5 text-xs font-medium text-navy hover:bg-mist disabled:opacity-60"
                      >
                        {pending === offer.id ? "Queueing…" : "Refresh now"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-navy">Jobs</h3>
        </div>
        {jobs.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">No jobs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Error</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium text-neutral-800">{job.type}</td>
                    <td className="px-4 py-3 text-neutral-600">{job.status}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-red-600">{job.lastError ?? "—"}</td>
                    <td className="px-4 py-3">
                      {job.status === "DEAD" || job.status === "FAILED" ? (
                        <button
                          type="button"
                          disabled={pending === job.id}
                          onClick={() => void onRetry(job.id)}
                          className="rounded-md border border-navy px-3 py-1.5 text-xs font-medium text-navy hover:bg-mist disabled:opacity-60"
                        >
                          {pending === job.id ? "Retrying…" : "Retry"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
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
