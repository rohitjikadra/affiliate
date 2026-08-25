import type { FreshnessLevel } from "@/types/product";

type FreshnessBadgeProps = {
  level: FreshnessLevel;
  label: string;
  className?: string;
};

const tone: Record<FreshnessLevel, string> = {
  fresh: "text-fresh",
  aging: "rounded-md bg-aging-bg px-2 py-0.5 text-aging",
  stale: "rounded-md bg-stale-bg px-2 py-0.5 text-stale",
  unknown: "text-unknown",
};

const dot: Record<FreshnessLevel, string> = {
  fresh: "bg-fresh",
  aging: "bg-aging",
  stale: "bg-stale",
  unknown: "bg-unknown",
};

export function FreshnessBadge({ level, label, className = "" }: FreshnessBadgeProps) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone[level]} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[level]}`} aria-hidden />
      {label}
    </p>
  );
}
