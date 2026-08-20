import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-3xl font-bold text-navy">Page not found</h1>
      <p className="mt-3 text-sm text-neutral-600">
        That URL is gone, unpublished, or never existed. Try the catalog or a buying guide.
      </p>
      <p className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/" className="font-medium text-navy underline">
          Home
        </Link>
        <Link href="/products" className="font-medium text-navy underline">
          Products
        </Link>
        <Link href="/guides" className="font-medium text-navy underline">
          Guides
        </Link>
      </p>
    </div>
  );
}
