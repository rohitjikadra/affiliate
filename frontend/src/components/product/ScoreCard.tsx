import type { ScoreBreakdownItem } from "@/types/product";

type ScoreCardProps = {
  score: number;
  breakdown?: ScoreBreakdownItem[];
  compact?: boolean;
};

export function ScoreCard({ score, breakdown = [], compact = false }: ScoreCardProps) {
  const clamped = Math.min(10, Math.max(0, score));

  return (
    <div className={compact ? "" : "rounded-md border border-line bg-paper px-4 py-4"}>
      <div className="flex items-end gap-3">
        <p className="font-display text-4xl font-semibold tabular-nums leading-none text-forest">{clamped.toFixed(1)}</p>
        <div className="pb-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Our Score</p>
          <p className="mt-0.5 text-xs text-ink-subtle">Editorial, not a customer rating</p>
        </div>
      </div>
      {breakdown.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {breakdown.map((item) => {
            const value = Math.min(10, Math.max(0, item.score));
            return (
              <li key={item.label}>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-ink-muted">{item.label}</span>
                  <span className="tabular-nums font-medium text-ink">{value.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div className="h-full rounded-full bg-forest" style={{ width: `${value * 10}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
