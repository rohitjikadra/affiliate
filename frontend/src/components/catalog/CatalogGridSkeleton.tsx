export function CatalogGridSkeleton({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <div className="shop-wrap py-8 sm:py-10" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading products</p>
      <div className="h-4 w-40 rounded-md bg-line" />
      <div className="mt-6 h-8 w-56 rounded-md bg-line sm:w-72" />
      <div className="mt-3 h-4 w-full max-w-md rounded-md bg-line" />
      {withSearch ? <div className="mt-5 h-14 max-w-2xl rounded-md bg-line" /> : null}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-md border border-line bg-surface">
            <div className="aspect-square bg-paper" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-16 rounded-md bg-line" />
              <div className="h-4 w-full rounded-md bg-line" />
              <div className="h-4 w-2/3 rounded-md bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
