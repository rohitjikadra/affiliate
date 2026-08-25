type SearchBarProps = {
  defaultValue?: string;
  action?: string;
  variant?: "default" | "hero";
  inputId?: string;
  autoFocus?: boolean;
};

export function SearchBar({
  defaultValue = "",
  action = "/products",
  variant = "default",
  inputId = "product-search",
  autoFocus = false,
}: SearchBarProps) {
  const hero = variant === "hero";

  return (
    <form action={action} method="get" role="search" className={`flex w-full overflow-hidden rounded-md border border-line bg-surface ${hero ? "" : "max-w-xl"}`}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        autoComplete="search"
        enterKeyHint="search"
        spellCheck={false}
        placeholder="Search mixer grinders, Prestige, Philips"
        className={
          hero
            ? "h-12 w-full border-0 bg-transparent px-4 text-base text-ink outline-none placeholder:text-ink-subtle sm:h-14"
            : "h-10 w-full border-0 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-ink-subtle"
        }
      />
      <button
        type="submit"
        className={
          hero
            ? "h-12 shrink-0 bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-2 sm:h-14 sm:px-6"
            : "h-10 shrink-0 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-2"
        }
      >
        Search
      </button>
    </form>
  );
}
