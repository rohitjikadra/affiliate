import Link from "next/link";
import { SearchBar } from "@/components/home/SearchBar";
import { SITE_HEADLINE } from "@/lib/site";

const APPLIANCE_CHIPS = [
  { href: "/products?q=mixer", label: "Mixer Grinders" },
  { href: "/products?q=air+fryer", label: "Air Fryers" },
  { href: "/products?q=induction", label: "Induction" },
  { href: "/products?q=kettle", label: "Kettles" },
  { href: "/products?q=blender", label: "Hand Blenders" },
];

export function HomeBanner() {
  return (
    <section className="pt-2 sm:pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">{SITE_HEADLINE}</p>
      <h1 className="font-display mt-3 max-w-3xl text-[1.85rem] font-semibold leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
        Find the right kitchen appliance at the right price.
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">
        Search a model, compare merchant offers, and read who each product is actually for — then check the live price.
      </p>
      <div className="mt-6 max-w-2xl">
        <SearchBar variant="hero" inputId="home-search" />
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {APPLIANCE_CHIPS.map((chip) => (
          <li key={chip.href}>
            <Link
              href={chip.href}
              className="inline-flex rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink hover:border-forest hover:text-forest"
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
