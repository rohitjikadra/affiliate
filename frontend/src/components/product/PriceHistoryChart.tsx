import { formatMoney } from "@/lib/money";
import type { PriceHistoryPoint } from "@/lib/api";

type PriceHistoryChartProps = {
  points: PriceHistoryPoint[];
};

export function PriceHistoryChart({ points }: PriceHistoryChartProps) {
  if (points.length < 2) {
    return null;
  }

  const width = 320;
  const height = 120;
  const padX = 8;
  const padY = 12;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const currency = points[0]?.currency ?? "INR";

  const coords = points.map((point, index) => {
    const x = padX + (index / (points.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (point.price - min) / span) * (height - padY * 2);
    return `${x},${y}`;
  });

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label="Recorded price chart">
        <polyline
          fill="none"
          stroke="#1f5c4d"
          strokeWidth="2"
          points={coords.join(" ")}
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{formatMoney(min, currency, 0)}</span>
        <span>{formatMoney(max, currency, 0)}</span>
      </div>
    </div>
  );
}
