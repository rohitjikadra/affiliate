type SearchBarProps = {
  defaultValue?: string;
  action?: string;
};

export function SearchBar({ defaultValue = "", action = "/products" }: SearchBarProps) {
  return (
    <form
      action={action}
      method="get"
      className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20"
    >
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search for headphones, cookware, running shoes…"
        className="w-full bg-transparent px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 sm:px-5"
      />
      <button
        type="submit"
        className="m-1.5 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
      >
        Search
      </button>
    </form>
  );
}
