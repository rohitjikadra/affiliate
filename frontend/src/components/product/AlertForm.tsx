"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createPriceAlert, type AlertType } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { ApiError } from "@/types/product";

type AlertFormProps = {
  productId: string;
  currentPrice?: number | null;
};

type FieldErrors = {
  email?: string;
  targetPrice?: string;
  percentThreshold?: string;
};

const EXTRA_TYPES: { value: AlertType; label: string; hint: string }[] = [
  { value: "TARGET_PRICE", label: "Target price", hint: "Email when the best eligible price reaches a rupee amount you set." },
  { value: "PERCENT_DROP", label: "Percent drop", hint: "Email when the best eligible price falls by a percent." },
  { value: "NEW_LOW", label: "New low on this site", hint: "Email when we record a new low for this product’s best eligible price." },
];

function explanationFor(type: AlertType): string {
  if (type === "PERCENT_DROP") {
    return "We’ll email you when the best eligible price on this site drops by your percent.";
  }
  if (type === "NEW_LOW") {
    return "We’ll email you when we record a new low for this product’s best eligible price.";
  }
  return "We’ll email you when the best eligible price on this site reaches your target.";
}

function fieldMessage(error: ApiError, path: string): string | undefined {
  return error.details?.find((detail) => detail.path === path)?.message;
}

function inputClass(invalid: boolean): string {
  return [
    "mt-1 w-full rounded-md border bg-surface px-3 py-2.5 text-base text-ink outline-none sm:text-sm",
    invalid ? "border-stale" : "border-line focus:border-forest",
  ].join(" ");
}

export function AlertForm({ productId, currentPrice }: AlertFormProps) {
  const [email, setEmail] = useState("");
  const [type, setType] = useState<AlertType>("TARGET_PRICE");
  const [targetPrice, setTargetPrice] = useState(
    currentPrice != null && Number.isFinite(currentPrice) ? String(Math.round(currentPrice)) : "",
  );
  const [percentThreshold, setPercentThreshold] = useState("10");
  const [moreOpen, setMoreOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(true);

  const currentLabel =
    currentPrice != null && Number.isFinite(currentPrice) ? formatMoney(currentPrice, "INR", 0) : null;
  const selectedExtra = EXTRA_TYPES.find((option) => option.value === type);

  function resetOutcome() {
    setError("");
    setRateLimited(false);
    setFieldErrors({});
  }

  function startAnother() {
    setDone(false);
    setEmailSent(true);
    resetOutcome();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    resetOutcome();

    const nextFields: FieldErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextFields.email = "Enter an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextFields.email = "Enter a valid email address.";
    }

    const payload: Parameters<typeof createPriceAlert>[0] = {
      productId,
      email: trimmedEmail,
      type,
    };

    if (type === "TARGET_PRICE") {
      const value = Number(targetPrice);
      if (!Number.isFinite(value) || value <= 0) {
        nextFields.targetPrice = "Enter a target price.";
      } else {
        payload.targetPrice = value;
      }
    }

    if (type === "PERCENT_DROP") {
      const value = Number(percentThreshold);
      if (!Number.isFinite(value) || value < 1 || value > 90) {
        nextFields.percentThreshold = "Enter a percent between 1 and 90.";
      } else {
        payload.percentThreshold = value;
      }
    }

    if (Object.keys(nextFields).length > 0) {
      setFieldErrors(nextFields);
      setPending(false);
      return;
    }

    try {
      const result = await createPriceAlert(payload);
      setEmailSent(result.emailSent !== false);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRateLimited(true);
        setError("Too many alert requests. Try again later.");
      } else if (err instanceof ApiError) {
        setFieldErrors({
          email: fieldMessage(err, "email"),
          targetPrice: fieldMessage(err, "targetPrice"),
          percentThreshold: fieldMessage(err, "percentThreshold"),
        });
        setError(err.message);
      } else {
        setError("Could not create this alert. Try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="price-alert" className="product-section scroll-mt-28 overflow-hidden !p-0">
      <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="border-b border-line bg-forest-soft px-5 py-6 sm:px-6 sm:py-7 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Price alert</p>
          <h2 className="product-section-title mt-2 text-[1.35rem] sm:text-xl">Watch this price</h2>
          <p className="mt-3 text-sm leading-6 text-ink">{explanationFor(type)}</p>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            No account needed. Confirm the first email, then we only write when the condition is met.
          </p>
        </div>

        <div className="px-5 py-6 sm:px-6 sm:py-7">
          {done ? (
            <div
              className={
                emailSent
                  ? "rounded-md border border-line bg-forest-soft px-4 py-5"
                  : "rounded-md border border-aging bg-aging-bg px-4 py-5"
              }
              role="status"
            >
              <p className="text-sm font-semibold text-ink">
                {emailSent ? "Alert saved — check your email" : "Alert saved — confirmation email not sent"}
              </p>
              {emailSent ? (
                <p className="mt-2 text-sm leading-6 text-ink">
                  Confirm the message we sent. After that, we’ll email you when this product matches your alert.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-ink">
                  Your alert is stored, but this site cannot send mail yet. We never show confirmation links here —
                  ask the shop to finish outbound email, then submit again.
                </p>
              )}
              <button type="button" onClick={startAnother} className="mt-4 text-sm font-semibold text-forest underline">
                Set another alert
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="price-alert-email" className="block text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="price-alert-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "price-alert-email-error" : undefined}
                  className={inputClass(Boolean(fieldErrors.email))}
                />
                {fieldErrors.email ? (
                  <p id="price-alert-email-error" className="mt-1 text-sm text-stale">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              {type === "TARGET_PRICE" ? (
                <div>
                  <label htmlFor="price-alert-target" className="block text-sm font-medium text-ink">
                    Target price
                  </label>
                  <div
                    className={[
                      "mt-1 flex overflow-hidden rounded-md border bg-surface focus-within:border-forest",
                      fieldErrors.targetPrice ? "border-stale" : "border-line",
                    ].join(" ")}
                  >
                    <span className="flex items-center bg-paper px-3 text-sm font-medium text-ink-muted">₹</span>
                    <input
                      id="price-alert-target"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={targetPrice}
                      onChange={(event) => setTargetPrice(event.target.value)}
                      required
                      aria-invalid={Boolean(fieldErrors.targetPrice)}
                      aria-describedby={
                        fieldErrors.targetPrice
                          ? "price-alert-target-error"
                          : currentLabel
                            ? "price-alert-current"
                            : undefined
                      }
                      className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-base text-ink outline-none sm:text-sm"
                    />
                  </div>
                  {fieldErrors.targetPrice ? (
                    <p id="price-alert-target-error" className="mt-1 text-sm text-stale">
                      {fieldErrors.targetPrice}
                    </p>
                  ) : currentLabel ? (
                    <p id="price-alert-current" className="mt-1 text-xs text-ink-subtle">
                      Current recorded price {currentLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {type === "PERCENT_DROP" ? (
                <div>
                  <label htmlFor="price-alert-percent" className="block text-sm font-medium text-ink">
                    Percent drop
                  </label>
                  <div
                    className={[
                      "mt-1 flex max-w-40 overflow-hidden rounded-md border bg-surface focus-within:border-forest",
                      fieldErrors.percentThreshold ? "border-stale" : "border-line",
                    ].join(" ")}
                  >
                    <input
                      id="price-alert-percent"
                      type="number"
                      min={1}
                      max={90}
                      step={1}
                      inputMode="numeric"
                      value={percentThreshold}
                      onChange={(event) => setPercentThreshold(event.target.value)}
                      required
                      aria-invalid={Boolean(fieldErrors.percentThreshold)}
                      aria-describedby={fieldErrors.percentThreshold ? "price-alert-percent-error" : undefined}
                      className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-base text-ink outline-none sm:text-sm"
                    />
                    <span className="flex items-center bg-paper px-3 text-sm font-medium text-ink-muted">%</span>
                  </div>
                  {fieldErrors.percentThreshold ? (
                    <p id="price-alert-percent-error" className="mt-1 text-sm text-stale">
                      {fieldErrors.percentThreshold}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink-subtle">Between 1 and 90.</p>
                  )}
                </div>
              ) : null}

              {type === "NEW_LOW" ? (
                <p className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-muted">
                  No extra number needed — we’ll watch for a new recorded low.
                </p>
              ) : null}

              {!moreOpen && type !== "TARGET_PRICE" ? (
                <p className="text-sm text-ink-muted">
                  Using {selectedExtra?.label.toLowerCase()}.{" "}
                  <button
                    type="button"
                    className="font-semibold text-forest underline"
                    onClick={() => setType("TARGET_PRICE")}
                  >
                    Back to target price
                  </button>
                </p>
              ) : null}

              <details
                className="rounded-md border border-line bg-paper px-3 py-2"
                open={moreOpen}
                onToggle={(event) => setMoreOpen(event.currentTarget.open)}
              >
                <summary className="cursor-pointer text-sm font-medium text-ink">More alert options</summary>
                <fieldset className="mt-3 space-y-2">
                  <legend className="sr-only">Alert type</legend>
                  {EXTRA_TYPES.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-sm text-ink"
                    >
                      <input
                        type="radio"
                        name="price-alert-type"
                        value={option.value}
                        checked={type === option.value}
                        onChange={() => setType(option.value)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium">{option.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-ink-subtle">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>
              </details>

              {rateLimited ? (
                <p className="rounded-md border border-aging bg-aging-bg px-3 py-2 text-sm text-aging" role="alert">
                  {error}
                </p>
              ) : error && !fieldErrors.email && !fieldErrors.targetPrice && !fieldErrors.percentThreshold ? (
                <p className="rounded-md border border-stale bg-stale-bg px-3 py-2 text-sm text-stale" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-forest-2 disabled:opacity-60 sm:w-auto sm:min-w-44"
              >
                {pending ? "Saving…" : "Notify me"}
              </button>

              <p className="text-xs leading-5 text-ink-subtle">
                We email this address only for this product’s price alerts. You can{" "}
                <Link href="/privacy" className="underline">
                  unsubscribe any time
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
