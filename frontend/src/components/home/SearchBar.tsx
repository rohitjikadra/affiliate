"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <form
      className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor="product-search" className="sr-only">
        Search products
      </label>
      <input
        id="product-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
