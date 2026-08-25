import type { SpecItem } from "@/types/product";

const HIGHLIGHT_COUNT = 4;

const columns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function QuickSpecs({ specs }: { specs: SpecItem[] }) {
  const items = specs.filter((item) => item.label?.trim() && item.value?.trim()).slice(0, HIGHLIGHT_COUNT);
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 overflow-hidden rounded-md border border-line">
      <ul className={`grid gap-px bg-line ${columns[items.length] ?? "grid-cols-2 sm:grid-cols-4"}`}>
        {items.map((item) => (
          <li key={item.label} className="bg-surface px-4 py-4">
            <p className="font-display text-lg font-semibold tracking-tight text-ink">{item.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-muted">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
