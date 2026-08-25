import Link from "next/link";
import { SearchBar } from "@/components/home/SearchBar";
import { SITE_TAGLINE } from "@/lib/site";

const SHOP_CHIPS = [
  { href: "/products?q=mixer", label: "Mixer grinders" },
  { href: "/products?q=air+fryer", label: "Air fryers" },
  { href: "/products?q=induction", label: "Induction" },
  { href: "/products?q=kettle", label: "Kettles" },
  { href: "/products?q=blender", label: "Hand blenders" },
];

export function HomeBanner() {
  return (
    <section className="rounded-2xl bg-forest px-5 py-8 text-white sm:px-8 sm:py-10">
      <h1 className="font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        {SITE_TAGLINE.replace(/\.$/, "")}
      </h1>
      <p className="mt-2 max-w-xl text-sm text-white/80">
        Photos, current merchant prices, and an honest “who should avoid” note — then a live offer.
      </p>
      <div className="mt-5">
        <SearchBar variant="hero" inputId="home-search" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SHOP_CHIPS.map((chip) => (
          <Link
            key={chip.href}
            href={chip.href}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
