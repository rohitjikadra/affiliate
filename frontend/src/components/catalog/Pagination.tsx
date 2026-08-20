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
    <nav className="mt-6 flex items-center justify-center gap-3 text-sm">
      {meta.previousPage ? (
        <Link href={href(meta.previousPage)} className="font-medium text-navy underline">
          Previous
        </Link>
      ) : (
        <span className="text-neutral-400">Previous</span>
      )}
      <span className="text-neutral-600">
        Page {meta.page} of {meta.pages}
      </span>
      {meta.nextPage ? (
        <Link href={href(meta.nextPage)} className="font-medium text-navy underline">
          Next
        </Link>
      ) : (
        <span className="text-neutral-400">Next</span>
      )}
    </nav>
  );
}
