"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@/types/product";
import { ApiError } from "@/types/product";
import { importAsins, searchCatalog, type DiscoveryCandidate, type ImportAsinsResult } from "@/lib/api";
import { redirectToLogin } from "@/lib/admin";

type ImportFormProps = {
  categories: ProductCategory[];
  creatorsConfigured: boolean;
};

function parseAsins(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((value) => value.trim().toUpperCase())
        .filter((value) => /^[A-Z0-9]{10}$/.test(value)),
    ),
  ].slice(0, 20);
}

export function ImportForm({ categories, creatorsConfigured }: ImportFormProps) {
  const router = useRouter();
  const [asins, setAsins] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchEnabled, setSearchEnabled] = useState(creatorsConfigured);
  const [pending, setPending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportAsinsResult | null>(null);

  async function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError("");
    try {
      const data = await searchCatalog(query.trim());
      setSearchEnabled(data.enabled);
      setCandidates(data.items);
      setSelected(data.items.map((item) => item.externalId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not search Amazon.");
    } finally {
      setSearching(false);
    }
  }

  async function onImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fromPaste = parseAsins(asins);
    const fromSearch = selected.filter((value) => /^[A-Z0-9]{10}$/.test(value));
    const ids = [...new Set([...fromPaste, ...fromSearch])].slice(0, 20);
    if (ids.length === 0) {
      setError("Paste at least one 10-character ASIN, or search and select items.");
      return;
    }
    setPending(true);
    setError("");
    setResult(null);
    try {
      const data = await importAsins(ids, categoryId || undefined);
      setResult(data);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        redirectToLogin();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not import ASINs.");
    } finally {
      setPending(false);
    }
  }

  function toggleSelected(asin: string) {
    setSelected((current) => (current.includes(asin) ? current.filter((item) => item !== asin) : [...current, asin]));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(event) => void onSearch(event)} className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-navy">Search Amazon</h2>
        <p className="mt-1 text-sm text-neutral-600">
          SearchItems runs only when Creators API credentials are set. Results stay as drafts until you publish.
        </p>
        <label className="mt-3 block text-sm font-medium text-neutral-800">
          Keywords
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="mixer grinder 750w"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-navy"
          />
        </label>
        <button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className="mt-3 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {searching ? "Searching…" : "Search"}
        </button>
        {!searchEnabled ? (
          <p className="mt-2 text-xs text-neutral-500">
            Creators API is not configured. Paste ASINs below; tagged /go links still work with manual prices.
          </p>
        ) : null}
        {candidates.length > 0 ? (
          <ul className="mt-4 divide-y divide-neutral-100">
            {candidates.map((item) => (
              <li key={item.externalId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <label className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.externalId)}
                    onChange={() => toggleSelected(item.externalId)}
                  />
                  <span className="truncate">
                    {item.title} <span className="text-neutral-500">{item.externalId}</span>
                  </span>
                </label>
                <span className="shrink-0 text-neutral-600">
                  {item.price != null ? `₹${item.price}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={(event) => void onImport(event)} className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold text-navy">Import ASINs</h2>
        <label className="mt-3 block text-sm font-medium text-neutral-800">
          ASINs
          <textarea
            value={asins}
            onChange={(event) => setAsins(event.target.value)}
            placeholder="B08CFJBZRK&#10;B00HVXS7WC"
            className="mt-1 min-h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-navy"
          />
        </label>
        {categories.length > 0 ? (
          <label className="mt-3 block text-sm font-medium text-neutral-800">
            Category
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-navy"
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import as drafts"}
        </button>
      </form>

      {result ? (
        <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
          <h2 className="font-semibold text-navy">Import result</h2>
          <p className="mt-2 text-neutral-600">
            {result.created.length} created as Draft. {result.attached.length} matched an existing identifier or offer.
            Nothing was published.
          </p>
          {result.created.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {result.created.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/products/${item.id}/edit`} className="text-navy underline">
                    {item.asin} · {item.slug}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
