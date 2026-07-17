import Link from "next/link";
import { Icon } from "@/components/ui";
import { STATUS_META, type BrandHalal } from "@/lib/halal-status";

/* "Similar {category} checks" cards: icon + question + status pill + chevron. */

export function categoryIcon(category: string): string {
  const c = category.toLowerCase();
  if (/bakery|cake|doughnut|kueh|dessert|sweet|chocolate|cookie|gummy/.test(c)) return "basket";
  if (/coffee|caf|tea|bubble|beverage|soya/.test(c)) return "coffee";
  if (/restaurant|sushi|hotpot|steak|seafood|beef|gyudon|fast food|burger|pizza|chicken|kopitiam|snack/.test(c)) return "utensils";
  return "store";
}

export function SimilarChecks({ items, category }: { items: BrandHalal[]; category: string }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="hcx-h2">Similar {category.toLowerCase()} checks</h2>
      <div className="hcx-sim-list">
        {items.map((r) => {
          const rm = STATUS_META[r.status];
          return (
            <Link key={r.slug} href={`/is-halal/${r.slug}`} className="hcx-sim-card">
              <span className={`hcx-sim-icon hcx-tone-${rm.tone}`} aria-hidden="true">
                <Icon name={categoryIcon(r.category)} size={18} />
              </span>
              <span className="hcx-sim-name">Is {r.brand} halal?</span>
              <span className={`hs-pill hs-${rm.tone}`}>{rm.verdict}</span>
              <Icon name="arrow" size={16} className="hcx-sim-arrow" />
            </Link>
          );
        })}
      </div>
      <p style={{ marginTop: 12 }}>
        <Link className="link-inline" href="/is-halal">See all brands in the halal checker →</Link>
      </p>
    </section>
  );
}
