"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createPriceAlert, type AlertType } from "@/lib/api";
import { ApiError } from "@/types/product";

type AlertFormProps = {
  productId: string;
  currentPrice?: number | null;
};

const TYPES: { value: AlertType; label: string }[] = [
  { value: "TARGET_PRICE", label: "When it drops to a price" },
  { value: "PERCENT_DROP", label: "When it drops by a percent" },
  { value: "NEW_LOW", label: "When it hits a new low here" },
];

export function AlertForm({ productId, currentPrice }: AlertFormProps) {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<AlertType>("TARGET_PRICE");
  const [targetPrice, setTargetPrice] = useState(
    currentPrice != null && Number.isFinite(currentPrice) ? String(Math.round(currentPrice)) : "",
  );
  const [percentThreshold, setPercentThreshold] = useState("10");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const payload: Parameters<typeof createPriceAlert>[0] = {
      productId,
      email: email.trim(),
      type,
    };
    if (type === "TARGET_PRICE") {
      const value = Number(targetPrice);
      if (!Number.isFinite(value) || value <= 0) {
        setPending(false);
        setError("Enter a target price.");
        return;
      }
      payload.targetPrice = value;
    }
    if (type === "PERCENT_DROP") {
      const value = Number(percentThreshold);
      if (!Number.isFinite(value) || value < 1 || value > 90) {
        setPending(false);
        setError("Enter a percent between 1 and 90.");
        return;
      }
      payload.percentThreshold = value;
    }

    try {
      await createPriceAlert(payload);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many alert requests. Try again later.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Could not create this alert. Try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div id="price-alert" className="product-section scroll-mt-28">
      <h2 className="product-section-title">Price alert</h2>
      {done ? (
        <p className="mt-2 text-sm text-ink">Check your email to confirm this alert.</p>
      ) : (
        <form onSubmit={(event) => void onSubmit(event)} className="mt-3 space-y-3">
          <label className="block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Alert type
            <select
              value={type}
              onChange={(event) => setType(event.target.value as AlertType)}
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
            >
              {TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {type === "TARGET_PRICE" ? (
            <label className="block text-sm font-medium text-ink">
              Target price (₹)
              <input
                type="number"
                min={1}
                step={1}
                value={targetPrice}
                onChange={(event) => setTargetPrice(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
              />
            </label>
          ) : null}
          {type === "PERCENT_DROP" ? (
            <label className="block text-sm font-medium text-ink">
              Percent drop
              <input
                type="number"
                min={1}
                max={90}
                step={1}
                value={percentThreshold}
                onChange={(event) => setPercentThreshold(event.target.value)}
                required
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-forest"
              />
            </label>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-2 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Create alert"}
          </button>
          <p className="text-xs text-ink-subtle">
            We email this address only for this product&apos;s price alerts. Confirm the first email, then you can{" "}
            <Link href="/privacy" className="underline">
              unsubscribe any time
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
