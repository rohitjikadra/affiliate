"use client";

import Link from "next/link";
import { useState } from "react";
import type { Guide } from "@/types/guide";
import { ApiError } from "@/types/product";
import { deleteGuide } from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";

type GuideTableProps = {
  initialGuides: Guide[];
};

export function GuideTable({ initialGuides }: GuideTableProps) {
  const [guides, setGuides] = useState(initialGuides);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onDelete(guide: Guide) {
    if (!window.confirm(`Delete “${guide.title}”? This cannot be undone.`)) {
      return;
    }

    setPendingId(guide.id);
    setError("");

    try {
      await deleteGuide(guide.id);
      setGuides((current) => current.filter((item) => item.id !== guide.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not delete guide.");
    } finally {
      setPendingId(null);
    }
  }

  if (guides.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-700">No guides yet.</p>
        <Link href="/admin/guides/create" className="mt-3 inline-block text-sm font-semibold text-navy">
          Create the first guide
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
      {error ? <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Guide</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{guide.title}</p>
                  <p className="text-xs text-neutral-500">{guide.slug}</p>
                </td>
                <td className="px-4 py-3 text-neutral-600">{guide.category?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      guide.published ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {guide.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {guide.published ? (
                      <Link
                        href={`/guides/${guide.slug}`}
                        className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white"
                      >
                        View
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/guides/${guide.id}/edit`}
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={pendingId === guide.id}
                      onClick={() => void onDelete(guide)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
