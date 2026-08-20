"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comparison, ComparisonPayload } from "@/types/comparison";
import type { Product } from "@/types/product";
import { createComparison, updateComparison } from "@/lib/api";
import { revalidateShop } from "@/lib/revalidate-shop";

export function ComparisonForm({ comparison, products }: { comparison?: Comparison; products: Product[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(comparison?.title ?? "");
  const [slug, setSlug] = useState(comparison?.slug ?? "");
  const [excerpt, setExcerpt] = useState(comparison?.excerpt ?? "");
  const [body, setBody] = useState(comparison?.body ?? "");
  const [methodology, setMethodology] = useState(comparison?.methodology ?? "");
  const [seoTitle, setSeoTitle] = useState(comparison?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(comparison?.seoDescription ?? "");
  const [published, setPublished] = useState(comparison?.published ?? false);
  const [left, setLeft] = useState(comparison?.items[0]?.product.id ?? products[0]?.id ?? "");
  const [right, setRight] = useState(comparison?.items[1]?.product.id ?? products[1]?.id ?? "");
  const [winnerProductId, setWinnerProductId] = useState(comparison?.winnerProductId ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!left || !right || left === right) {
      setError("Pick two different products.");
      return;
    }
    const payload: ComparisonPayload = {
      title,
      slug: slug || undefined,
      excerpt: excerpt || null,
      body,
      published,
      methodology: methodology || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      winnerProductId: winnerProductId || left,
      items: [
        { productId: left, sortOrder: 0 },
        { productId: right, sortOrder: 1 },
      ],
    };
    setSaving(true);
    try {
      if (comparison) {
        await updateComparison(comparison.id, payload);
      } else {
        await createComparison(payload);
      }
      await revalidateShop(["/compare", `/compare/${slug || comparison?.slug || ""}`]);
      router.push("/admin/comparisons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save comparison");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-md border border-neutral-200 bg-white p-5">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="block text-sm">
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
      </label>
      <label className="block text-sm">
        Slug
        <input value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Excerpt
        <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Product A
          <select value={left} onChange={(event) => setLeft(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.title}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Product B
          <select value={right} onChange={(event) => setRight(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.title}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Winner
        <select value={winnerProductId} onChange={(event) => setWinnerProductId(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
          <option value={left}>Product A</option>
          <option value={right}>Product B</option>
        </select>
      </label>
      <label className="block text-sm">
        Methodology
        <textarea value={methodology} onChange={(event) => setMethodology(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        SEO title
        <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" maxLength={120} />
      </label>
      <label className="block text-sm">
        SEO description
        <textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" maxLength={300} />
      </label>
      <label className="block text-sm">
        Body (Markdown)
        <textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 min-h-40 w-full rounded-md border px-3 py-2 font-mono" required />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
        Published
      </label>
      <button disabled={saving} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">
        {saving ? "Saving…" : "Save comparison"}
      </button>
    </form>
  );
}
