"use client";

import { useState } from "react";
import type { Merchant, Offer, OfferPayload } from "@/types/product";
import { createOffer, deleteOffer, updateOffer } from "@/lib/api";
import { revalidateShop } from "@/lib/revalidate-shop";

export function OffersEditor({
  productId,
  productSlug,
  offers,
  merchants,
}: {
  productId: string;
  productSlug?: string;
  offers: Offer[];
  merchants: Merchant[];
}) {
  const [rows, setRows] = useState(offers);
  const [merchantId, setMerchantId] = useState(merchants[0]?.id ?? "");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  async function onAdd() {
    if (!merchantId || !affiliateUrl.trim()) {
      setMessage("Merchant and affiliate URL are required.");
      return;
    }
    const payload: OfferPayload = {
      merchantId,
      affiliateUrl: affiliateUrl.trim(),
      currency: "INR",
      price: price.trim() ? Number(price) : null,
      inStock: true,
      isPrimary: rows.length === 0,
    };
    const created = await createOffer(productId, payload);
    setRows((current) => [...current, created]);
    setAffiliateUrl("");
    setPrice("");
    setMessage("Offer saved.");
    await revalidateShop(["/products", productSlug ? `/products/${productSlug}` : "/products"]);
  }

  async function onRecommended(offer: Offer) {
    const updated = await updateOffer(productId, offer.id, { isPrimary: true });
    setRows((current) => current.map((row) => ({ ...row, isPrimary: row.id === updated.id })));
    await revalidateShop(["/products", productSlug ? `/products/${productSlug}` : "/products"]);
  }

  async function onRemove(offer: Offer) {
    await deleteOffer(productId, offer.id);
    setRows((current) => current.filter((row) => row.id !== offer.id));
    await revalidateShop(["/products", productSlug ? `/products/${productSlug}` : "/products"]);
  }

  return (
    <div className="rounded-md border border-neutral-200 p-4">
      <h3 className="text-sm font-semibold text-navy">Merchant offers</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Add any merchant offer. Recommended is editorial. Best price is the cheapest eligible offer. Affiliate URLs stay in admin. Public pages only get a tracked /go link.
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map((offer) => (
          <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-100 px-3 py-2">
            <span>
              {offer.merchant.name}
              {offer.isPrimary ? " · recommended" : ""}
              {offer.price ? ` · ${offer.price} ${offer.currency}` : ""}
            </span>
            <span className="flex gap-2">
              {!offer.isPrimary ? (
                <button type="button" className="text-navy underline" onClick={() => void onRecommended(offer)}>
                  Make recommended
                </button>
              ) : null}
              <button type="button" className="text-red-700 underline" onClick={() => void onRemove(offer)}>
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-neutral-600">
          Merchant
          <select value={merchantId} onChange={(event) => setMerchantId(event.target.value)} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
          {merchants.map((merchant) => (
            <option key={merchant.id} value={merchant.id}>
              {merchant.name}
            </option>
          ))}
        </select>
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Offer URL
          <input
          value={affiliateUrl}
          onChange={(event) => setAffiliateUrl(event.target.value)}
          placeholder="https://merchant.example/offer"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        </label>
        <label className="text-xs font-medium text-neutral-600">
          Price
          <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Price"
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        </label>
      </div>
      <button type="button" onClick={() => void onAdd()} className="mt-3 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white">
        Add offer
      </button>
      {message ? <p className="mt-2 text-xs text-neutral-600">{message}</p> : null}
    </div>
  );
}
