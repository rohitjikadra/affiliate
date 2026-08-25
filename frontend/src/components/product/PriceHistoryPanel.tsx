"use client";

import { useState } from "react";
import { AmazonPriceDisclaimer } from "@/components/legal/AmazonPriceDisclaimer";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { getPriceHistory, type PriceHistory } from "@/lib/api";
import { formatMoney } from "@/lib/money";

const RANGES = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
] as const;

type HistoryRange = (typeof RANGES)[number]["value"];

type PriceHistoryPanelProps = {
  productSlug: string;
  initial: PriceHistory;
  initialRange?: HistoryRange;
  showAmazonDisclaimer: boolean;
};

export function PriceHistoryPanel({
  productSlug,
  initial,
  initialRange = "30d",
  showAmazonDisclaimer,
}: PriceHistoryPanelProps) {
  const [range, setRange] = useState<HistoryRange>(initialRange);
  const [history, setHistory] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function selectRange(next: HistoryRange) {
    if (next === range || !history.enabled || pending) {
      return;
    }
    setPending(true);
    setError("");
    try {
      const data = await getPriceHistory(productSlug, next, { revalidate: false });
      setRange(next);
      setHistory(data);
    } catch {
      setError("Could not load this range. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!history.enabled) {
    return (
      <div>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Price tracking will appear after automatic checks begin.
        </p>
        <p className="mt-2 text-xs text-ink-subtle">Prices recorded on this site. This is not Amazon official price history.</p>
      </div>
    );
  }

  const showChart = history.points.length > 1 && history.stats;
  const currency = history.points[0]?.currency ?? "INR";
  const current = history.points[history.points.length - 1]?.price;

  return (
    <div>
      <div className="mt-4 flex rounded-md border border-line p-1" role="tablist" aria-label="Price history range">
        {RANGES.map((option) => {
          const active = option.value === range;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={pending}
              onClick={() => void selectRange(option.value)}
              className={`flex-1 rounded-sm px-3 py-2 text-sm font-semibold ${
                active ? "bg-forest text-white" : "text-ink-muted hover:text-ink"
              } disabled:opacity-60`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-stale">{error}</p> : null}

      {showChart && history.stats ? (
        <>
          <p className="mt-4 text-sm text-ink-muted">{history.stats.label}.</p>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Current" value={current != null ? formatMoney(current, currency, 0) : "—"} />
            <Stat label="Lowest" value={formatMoney(history.stats.low, currency, 0)} />
            <Stat label="Highest" value={formatMoney(history.stats.high, currency, 0)} />
            <Stat label="Average" value={formatMoney(history.stats.average, currency, 0)} />
          </dl>
          <div className={pending ? "opacity-60" : ""}>
            <PriceHistoryChart points={history.points} />
          </div>
          <p className="mt-2 text-xs text-ink-subtle">
            Prices recorded on this site. This is not Amazon official price history.
          </p>
          {showAmazonDisclaimer ? <AmazonPriceDisclaimer className="mt-2 text-xs leading-5 text-ink-subtle" /> : null}
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Price tracking will appear after automatic checks begin.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper px-3 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-base font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
