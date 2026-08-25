import { BestPickCard } from "@/components/best/BestPickCard";
import { GuideBody } from "@/components/guides/GuideBody";
import { AffiliateNotice } from "@/components/legal/AffiliateNotice";
import type { Guide } from "@/types/guide";

export function BestOfView({ guide }: { guide: Guide }) {
  const body = guide.body?.trim() ?? "";

  return (
    <div className="space-y-8 sm:space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">Best of</p>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-4xl">{guide.title}</h1>
        {guide.excerpt ? <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-muted sm:text-base">{guide.excerpt}</p> : null}
        {guide.methodology ? (
          <p className="mt-5 rounded-md border border-line bg-forest-soft px-4 py-3 text-sm leading-6 text-ink">
            <span className="font-semibold">How we rank: </span>
            {guide.methodology}
          </p>
        ) : null}
      </header>

      {guide.products.length > 0 ? (
        <section>
          <h2 className="product-section-title mb-4">Ranked recommendations</h2>
          <ol className="list-none space-y-5 p-0 sm:space-y-6">
            {guide.products.map((item, index) => (
              <li key={item.id}>
                <BestPickCard item={item} rank={item.rank ?? index + 1} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {body ? (
        <section className="product-section">
          <h2 className="product-section-title">The buying notes</h2>
          <div className="mt-4 text-sm leading-7 text-ink">
            <GuideBody body={body} />
          </div>
        </section>
      ) : null}

      <AffiliateNotice className="text-sm leading-6 text-ink-muted" />
    </div>
  );
}
