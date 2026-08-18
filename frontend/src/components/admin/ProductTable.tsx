"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types/product";
import { ApiError } from "@/types/product";
import { deleteProduct, setProductStatus } from "@/lib/api";
import { formatMoney } from "@/lib/money";

type ProductTableProps = {
  initialProducts: Product[];
};

export function ProductTable({ initialProducts }: ProductTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onToggle(product: Product) {
    setPendingId(product.id);
    setError("");

    try {
      const updated = await setProductStatus(product.id, !product.isActive);
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update product status.");
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(product: Product) {
    if (!window.confirm(`Delete “${product.title}”? This cannot be undone.`)) {
      return;
    }

    setPendingId(product.id);
    setError("");

    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete product.");
    } finally {
      setPendingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No products yet.</p>
        <Link href="/admin/products/create" className="mt-3 inline-block text-sm font-semibold text-teal-700">
          Create the first product
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {error ? <p className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 font-semibold text-slate-500">
                        {product.title.charAt(0)}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{product.title}</p>
                      <p className="text-xs text-slate-500">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{product.category?.name ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {formatMoney(product.price, product.currency)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={pendingId === product.id}
                      onClick={() => void onToggle(product)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {product.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === product.id}
                      onClick={() => void onDelete(product)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
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
