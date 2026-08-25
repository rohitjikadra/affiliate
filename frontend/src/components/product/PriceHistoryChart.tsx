import { formatMoney } from "@/lib/money";
import type { PriceHistoryPoint } from "@/lib/api";

type PriceHistoryChartProps = {
  points: PriceHistoryPoint[];
};

export function PriceHistoryChart({ points }: PriceHistoryChartProps) {
  if (points.length < 2) {
    return null;
  }

  const width = 640;
  const height = 220;
  const padLeft = 64;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const currency = points[0]?.currency ?? "INR";
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const coords = points.map((point, index) => {
    const x = padLeft + (index / (points.length - 1)) * innerWidth;
    const y = padTop + (1 - (point.price - min) / span) * innerHeight;
    return { x, y, price: point.price };
  });

  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = [
    `${coords[0].x},${padTop + innerHeight}`,
    ...coords.map((point) => `${point.x},${point.y}`),
    `${coords[coords.length - 1].x},${padTop + innerHeight}`,
  ].join(" ");

  const ticks = [max, (max + min) / 2, min];
  const firstDate = new Date(points[0].recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const lastDate = new Date(points[points.length - 1].recordedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const last = coords[coords.length - 1];
  const summary = `Prices recorded on this site from ${firstDate} to ${lastDate}. Low ${formatMoney(min, currency, 0)}, high ${formatMoney(max, currency, 0)}.`;

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full sm:h-56" role="img" aria-label={summary}>
        {ticks.map((tick, index) => {
          const y = padTop + (1 - (tick - min) / span) * innerHeight;
          return (
            <g key={`${tick}-${index}`}>
              <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="#e7e2d9" strokeWidth="1" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-ink-muted" fontSize="11">
                {formatMoney(tick, currency, 0)}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="#1f5c4d" fillOpacity="0.08" />
        <polyline fill="none" stroke="#1f5c4d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={line} />
        <circle cx={last.x} cy={last.y} r="4.5" fill="#1f5c4d" />
        <text x={padLeft} y={height - 6} className="fill-ink-subtle" fontSize="11">
          {firstDate}
        </text>
        <text x={width - padRight} y={height - 6} textAnchor="end" className="fill-ink-subtle" fontSize="11">
          {lastDate}
        </text>
      </svg>
      <p className="sr-only">{summary}</p>
    </div>
  );
}
