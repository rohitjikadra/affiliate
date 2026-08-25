export function CatalogUnavailable() {
  return (
    <div className="rounded-md border border-dashed border-line bg-surface px-6 py-16 text-center">
      <p className="text-sm font-medium text-ink">Could not load the catalog.</p>
      <p className="mt-1 text-sm text-ink-subtle">Make sure the API is running, then refresh this page.</p>
    </div>
  );
}
