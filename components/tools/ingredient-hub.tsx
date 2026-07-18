/* Server component — a category hub page for the ingredient checker. Lists the
   hub's indexable members grouped by halal status (a server-rendered, no-JS
   "filter" that is crawlable and accessible), with an intro and links back to
   the main checker. */
import Link from "next/link";
import { Icon } from "@/components/ui";
import { STATUS_META, ingredientSlug, type Additive, type AdditiveStatus } from "@/lib/tools/ingredients";
import type { IngredientHub } from "@/lib/tools/ingredient-hubs";

const STATUS_ORDER: AdditiveStatus[] = ["halal", "mushbooh", "haram"];
const GROUP_HEADING: Record<AdditiveStatus, string> = {
  halal: "Generally halal",
  mushbooh: "Doubtful — verify the source",
  haram: "Best avoided",
};

export function IngredientHubView({ hub, members }: { hub: IngredientHub; members: Additive[] }) {
  const groups = STATUS_ORDER
    .map((s) => ({ status: s, items: members.filter((a) => a.status === s) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="screen-in hh-page ing-hub">
      <section className="seo-hero hh-pattern">
        <div className="hh-wrap">
          <nav className="ingd-crumb" aria-label="Breadcrumb">
            <Link className="link-inline" href="/tools">Tools</Link>
            <span aria-hidden="true">›</span>
            <Link className="link-inline" href="/tools/ingredient-checker">Ingredient Checker</Link>
            <span aria-hidden="true">›</span>
            <Link className="link-inline" href="/tools/ingredient-checker/categories">Categories</Link>
            <span aria-hidden="true">›</span>
            <span className="ingd-crumb-cur">{hub.title}</span>
          </nav>
          <h1 className="ingd-h1">{hub.title}</h1>
          <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>{hub.intro}</p>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        <p className="ing-hub-about">{hub.about}</p>

        {groups.map((g) => {
          const m = STATUS_META[g.status];
          return (
            <section key={g.status} className="ing-hub-group" aria-labelledby={`grp-${g.status}`}>
              <h2 id={`grp-${g.status}`} className="ing-hub-grouphead">
                <span className={`hs-pill hs-${m.tone}`}>{m.verdict}</span> {GROUP_HEADING[g.status]}
              </h2>
              <ul className="ing-hub-list">
                {g.items.map((a) => (
                  <li key={a.code || a.name}>
                    <Link href={`/tools/ingredient-checker/${ingredientSlug(a)}`} className="ing-hub-card">
                      <span className="ing-hub-name">
                        {a.code && <strong>{a.code}</strong>} {a.name}
                      </span>
                      {a.fn && <span className="ing-hub-fn">{a.fn}</span>}
                      <Icon name="arrow" size={15} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="ing-hub-foot">
          <Link href="/tools/ingredient-checker" className="link-inline">← Back to the full ingredient checker</Link>
          <Link href="/tools/ingredient-checker/categories" className="link-inline">Browse all categories →</Link>
        </div>
      </div>
    </div>
  );
}
