import { PriceHistoryPanel } from "@/components/product/PriceHistoryPanel";
import { getPriceHistory } from "@/lib/api";

type PriceHistorySectionProps = {
  productSlug: string;
  showAmazonDisclaimer: boolean;
};

export async function PriceHistorySection({ productSlug, showAmazonDisclaimer }: PriceHistorySectionProps) {
  let history: Awaited<ReturnType<typeof getPriceHistory>>;
  try {
    history = await getPriceHistory(productSlug, "30d");
  } catch {
    history = { enabled: false, points: [], stats: null };
  }

  return (
    <section className="product-section" id="price-history">
      <h2 className="product-section-title">Price history</h2>
      <PriceHistoryPanel
        productSlug={productSlug}
        initial={history}
        initialRange="30d"
        showAmazonDisclaimer={showAmazonDisclaimer}
      />
    </section>
  );
}
