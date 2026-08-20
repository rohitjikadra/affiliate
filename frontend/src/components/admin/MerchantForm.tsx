"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Merchant, MerchantKind, MerchantPayload } from "@/types/product";
import { createMerchant, updateMerchant } from "@/lib/api";

export function MerchantForm({ merchant }: { merchant?: Merchant }) {
  const router = useRouter();
  const [name, setName] = useState(merchant?.name ?? "");
  const [slug, setSlug] = useState(merchant?.slug ?? "");
  const [kind, setKind] = useState<MerchantKind>(merchant?.kind ?? "MARKETPLACE");
  const [network, setNetwork] = useState(merchant?.network ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(merchant?.websiteUrl ?? "");
  const [defaultTag, setDefaultTag] = useState(merchant?.defaultTag ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload: MerchantPayload = {
      name,
      slug: slug || undefined,
      kind,
      network: network || null,
      websiteUrl: websiteUrl || null,
      defaultTag: defaultTag || null,
      isActive: true,
    };
    try {
      if (merchant) {
        await updateMerchant(merchant.id, payload);
      } else {
        await createMerchant(payload);
      }
      router.push("/admin/merchants");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save merchant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-md border border-neutral-200 bg-white p-5">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="block text-sm">
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" required />
      </label>
      <label className="block text-sm">
        Slug
        <input value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Kind
        <select value={kind} onChange={(event) => setKind(event.target.value as MerchantKind)} className="mt-1 w-full rounded-md border px-3 py-2">
          <option value="MARKETPLACE">Marketplace</option>
          <option value="DIRECT">Direct</option>
          <option value="NETWORK">Network</option>
        </select>
      </label>
      <label className="block text-sm">
        Network (AMAZON, DIRECT, IMPACT…)
        <input value={network} onChange={(event) => setNetwork(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Website
        <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Default tracking tag
        <input value={defaultTag} onChange={(event) => setDefaultTag(event.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </label>
      <button disabled={saving} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">
        {saving ? "Saving…" : "Save merchant"}
      </button>
    </form>
  );
}
