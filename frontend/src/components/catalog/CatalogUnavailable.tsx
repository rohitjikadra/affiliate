export function CatalogUnavailable() {
  return (
    <div className="rounded-md border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-neutral-700">Could not load the catalog.</p>
      <p className="mt-1 text-sm text-neutral-500">
        Make sure the API is running, then refresh this page.
      </p>
    </div>
  );
}
