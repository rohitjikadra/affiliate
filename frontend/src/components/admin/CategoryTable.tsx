"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductCategory } from "@/types/product";
import { ApiError } from "@/types/product";
import { deleteCategory } from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";

type CategoryTableProps = {
  initialCategories: ProductCategory[];
};

export function CategoryTable({ initialCategories }: CategoryTableProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onDelete(category: ProductCategory) {
    if (!window.confirm(`Delete “${category.name}”? Products in this category must be moved first.`)) {
      return;
    }

    setPendingId(category.id);
    setError("");

    try {
      await deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not delete category.");
    } finally {
      setPendingId(null);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-700">No categories yet.</p>
        <Link href="/admin/categories/create" className="mt-3 inline-block text-sm font-semibold text-navy">
          Create the first category
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
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{category.name}</td>
                <td className="px-4 py-3 text-neutral-600">{category.slug}</td>
                <td className="px-4 py-3 text-neutral-600">{category.productCount ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/categories/${category.slug}`}
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={pendingId === category.id}
                      onClick={() => void onDelete(category)}
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
