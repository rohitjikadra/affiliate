export function CatalogUnavailable() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-700">Could not load the catalog.</p>
      <p className="mt-1 text-sm text-slate-500">
        Make sure the API is running, then refresh this page.
      </p>
    </div>
  );
}
