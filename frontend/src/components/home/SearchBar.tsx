type SearchBarProps = {
  defaultValue?: string;
  action?: string;
  variant?: "default" | "hero";
  inputId?: string;
};

export function SearchBar({
  defaultValue = "",
  action = "/products",
  variant = "default",
  inputId = "product-search",
}: SearchBarProps) {
  const hero = variant === "hero";

  return (
    <form action={action} method="get" className={`flex w-full ${hero ? "max-w-2xl" : "max-w-xl"}`}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search Prestige, Philips, mixer grinders"
        className={
          hero
            ? "h-12 w-full rounded-l-md border-0 bg-white px-4 text-base text-ink outline-none"
            : "h-10 w-full rounded-l-md border border-neutral-300 px-3 text-sm outline-none focus:border-navy"
        }
      />
      <button
        type="submit"
        className={
          hero
            ? "h-12 rounded-r-md bg-search px-5 text-sm font-bold text-white hover:bg-search-hover"
            : "h-10 rounded-r-md bg-search px-4 text-sm font-bold text-white hover:bg-search-hover"
        }
      >
        Search
      </button>
    </form>
  );
}
