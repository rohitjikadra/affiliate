import { AmazonPriceDisclaimer } from "@/components/legal/AmazonPriceDisclaimer";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { getPriceHistory } from "@/lib/api";
import { formatMoney } from "@/lib/money";

type PriceHistorySectionProps = {
  productSlug: string;
  showAmazonDisclaimer: boolean;
};

export async function PriceHistorySection({ productSlug, showAmazonDisclaimer }: PriceHistorySectionProps) {
  let history: Awaited<ReturnType<typeof getPriceHistory>>;
  try {
    history = await getPriceHistory(productSlug, "90d");
  } catch {
    history = { enabled: false, points: [], stats: null };
  }

  const showChart = history.enabled && history.points.length > 1;
  const currency = history.points[0]?.currency ?? "INR";

  return (
    <section className="product-section">
      <h2 className="product-section-title">Price history</h2>
      {showChart && history.stats ? (
        <>
          <p className="mt-2 text-sm text-ink-muted">{history.stats.label}.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Low {formatMoney(history.stats.low, currency, 0)} · High {formatMoney(history.stats.high, currency, 0)} · Average{" "}
            {formatMoney(history.stats.average, currency, 0)}
          </p>
          <PriceHistoryChart points={history.points} />
          <p className="mt-2 text-xs text-ink-subtle">
            This is not Amazon official price history. Points are merchant checks recorded on this site.
          </p>
          {showAmazonDisclaimer ? <AmazonPriceDisclaimer className="mt-2 text-xs leading-5 text-ink-subtle" /> : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">We&apos;ll chart prices after the first automatic checks.</p>
      )}
    </section>
  );
}
