import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Product management
          </h1>
        </div>
        <nav className="flex gap-3 text-sm font-medium">
          <Link href="/admin/products" className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-white">
            All products
          </Link>
          <Link href="/admin/products/create" className="rounded-xl bg-teal-700 px-4 py-2 text-white hover:bg-teal-800">
            Add product
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
