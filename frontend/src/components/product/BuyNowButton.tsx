"use client";

import { useState } from "react";
import { ApiError } from "@/types/product";
import { startCheckout } from "@/lib/api";

type BuyNowButtonProps = {
  slug: string;
  available: boolean;
};

export function BuyNowButton({ slug, available }: BuyNowButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onBuy() {
    if (!available || pending) {
      return;
    }

    setPending(true);
    setMessage("");

    try {
      const result = await startCheckout(slug);
      window.location.assign(result.url);
    } catch (error) {
      setPending(false);
      setMessage(
        error instanceof ApiError
          ? error.message
          : "This offer is currently unavailable.",
      );
    }
  }

  if (!available) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        This offer is currently unavailable.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void onBuy()}
        disabled={pending}
        className="w-full rounded-2xl bg-teal-700 px-6 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-60 sm:w-auto sm:min-w-56"
      >
        {pending ? "Taking you to the store…" : "Buy Now"}
      </button>
      {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
