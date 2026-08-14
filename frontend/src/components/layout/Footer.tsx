import { ApiStatus } from "@/components/home/ApiStatus";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} AffiliateHub. Sample catalog for the MVP foundation.</p>
        <ApiStatus />
      </div>
    </footer>
  );
}
