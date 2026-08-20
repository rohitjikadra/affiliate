"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types/product";
import { ApiError } from "@/types/product";
import { deleteProduct, setProductStatus } from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";
import { formatOptionalMoney } from "@/lib/money";

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
      setProducts((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...updated, clickCount: item.clickCount } : item,
        ),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
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
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not delete product.");
    } finally {
      setPendingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-700">No products match this view.</p>
        <Link href="/admin/products/create" className="mt-3 inline-block text-sm font-semibold text-navy">
          Create a product
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
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Clicks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-100 font-semibold text-neutral-500">
                        {product.title.charAt(0)}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-neutral-900">{product.title}</p>
                      <p className="text-xs text-neutral-500">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{product.category?.name ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {formatOptionalMoney(product.price, product.currency) ?? "See offer"}
                </td>
                <td className="px-4 py-3 text-neutral-600">{product.clickCount ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={pendingId === product.id}
                      onClick={() => void onToggle(product)}
                      className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-white disabled:opacity-60"
                    >
                      {product.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === product.id}
                      onClick={() => void onDelete(product)}
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
