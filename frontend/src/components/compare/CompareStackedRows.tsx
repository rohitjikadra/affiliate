type CompareRow = {
  label: string;
  values: (string | null)[];
};

type CompareStackedRowsProps = {
  title: string;
  columnLabels: string[];
  rows: CompareRow[];
};

export function CompareStackedRows({ title, columnLabels, rows }: CompareStackedRowsProps) {
  if (rows.length === 0) {
    return null;
  }

  const count = columnLabels.length;
  const desktopCols =
    count === 3
      ? "md:grid-cols-[9.5rem_repeat(3,minmax(0,1fr))]"
      : count === 2
        ? "md:grid-cols-[9.5rem_repeat(2,minmax(0,1fr))]"
        : "md:grid-cols-[9.5rem_minmax(0,1fr)]";

  return (
    <section className="product-section">
      <h2 className="product-section-title">{title}</h2>

      <div className="mt-4 space-y-4 md:hidden">
        {rows.map((row) => (
          <div key={row.label} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{row.label}</p>
            <dl className="mt-2 space-y-2">
              {columnLabels.map((name, index) => (
                <div key={`${row.label}-${name}`} className="flex items-start justify-between gap-3 text-sm leading-6">
                  <dt className="max-w-[42%] shrink-0 text-ink-muted">{name}</dt>
                  <dd className="text-right font-medium text-ink">{row.values[index] ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className={`mt-4 hidden overflow-hidden rounded-md border border-line md:grid md:gap-px md:bg-line ${desktopCols}`}>
        <div className="bg-paper px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {title}
        </div>
        {columnLabels.map((name) => (
          <div key={name} className="bg-paper px-3 py-2.5 text-xs font-semibold text-ink">
            {name}
          </div>
        ))}
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className="bg-surface px-3 py-3 text-sm font-medium text-ink-muted">{row.label}</div>
            {row.values.map((value, index) => (
              <div key={`${row.label}-${index}`} className="bg-surface px-3 py-3 text-sm leading-6 text-ink">
                {value ?? "—"}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
