type SearchBarProps = {
  defaultValue?: string;
  action?: string;
};

export function SearchBar({ defaultValue = "", action = "/products" }: SearchBarProps) {
  return (
    <form action={action} method="get" className="flex w-full max-w-xl">
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search products"
        className="h-10 w-full rounded-l-md border border-neutral-300 px-3 text-sm outline-none focus:border-navy"
      />
      <button
        type="submit"
        className="h-10 rounded-r-md bg-search px-4 text-sm font-bold text-navy hover:bg-search-hover"
      >
        Search
      </button>
    </form>
  );
}
