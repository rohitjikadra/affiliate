type ScoreBadgeProps = {
  score: number;
  className?: string;
};

export function ScoreBadge({ score, className = "" }: ScoreBadgeProps) {
  const clamped = Math.min(10, Math.max(0, score));

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="rounded-md bg-navy px-2 py-1 text-sm font-bold text-white">{clamped.toFixed(1)}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Our Score</span>
    </span>
  );
}
