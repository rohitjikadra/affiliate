import Link from "next/link";
import type { PaginationMeta } from "@/types/product";

export function Pagination({ meta, basePath }: { meta: PaginationMeta; basePath: string }) {
  if (meta.pages <= 1) {
    return null;
  }

  const href = (page: number) => {
    const url = new URL(basePath, "http://local.invalid");
    url.searchParams.set("page", String(page));
    return `${url.pathname}${url.search}`;
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm" aria-label="Pagination">
      {meta.previousPage ? (
        <Link
          href={href(meta.previousPage)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 font-semibold text-ink hover:border-forest hover:text-forest"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-md border border-transparent px-3 py-1.5 text-ink-subtle">Previous</span>
      )}
      <span className="text-ink-muted">
        Page {meta.page} of {meta.pages}
      </span>
      {meta.nextPage ? (
        <Link
          href={href(meta.nextPage)}
          className="rounded-md border border-line bg-surface px-3 py-1.5 font-semibold text-ink hover:border-forest hover:text-forest"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-md border border-transparent px-3 py-1.5 text-ink-subtle">Next</span>
      )}
    </nav>
  );
}
