"use client";

import { useMemo, useState } from "react";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { SearchBar } from "@/components/home/SearchBar";
import { categories, featuredProducts } from "@/lib/mock-data";

export function HomePage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const visibleProducts = useMemo(() => {
    const needle = submittedQuery.trim().toLowerCase();

    return featuredProducts.filter((product) => {
      const matchesCategory = activeCategory
        ? product.categorySlug === activeCategory
        : true;
      const matchesQuery = needle
        ? `${product.title} ${product.description} ${product.categoryName}`
            .toLowerCase()
            .includes(needle)
        : true;

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, submittedQuery]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-14 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">
          Product discovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Find products worth recommending.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Search the catalog, browse categories, and explore featured picks.
          Amazon and Flipkart integrations will land in a later milestone.
        </p>
        <div className="mt-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => setSubmittedQuery(query)}
          />
        </div>
      </section>

      <div className="space-y-14">
        <CategoryGrid
          categories={categories}
          activeSlug={activeCategory}
          onSelect={setActiveCategory}
        />
        <FeaturedProducts products={visibleProducts} query={submittedQuery} />
      </div>
    </div>
  );
}
