import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Icon } from "@/components/ui";
import { indexableHubs, hubMembers } from "@/lib/tools/ingredient-hubs";

export const revalidate = 3600;

export const metadata: Metadata = pageMeta({
  title: "Ingredient Categories — Halal Status by Type & E-number",
  description:
    "Browse food additives by category — colourings, emulsifiers, preservatives, animal-derived and source-dependent ingredients — with their halal status and how to verify.",
  path: "/tools/ingredient-checker/categories",
  absoluteTitle: true,
});

export default function Page() {
  const hubs = indexableHubs();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "Ingredient Checker", path: "/tools/ingredient-checker" },
            { name: "Categories", path: "/tools/ingredient-checker/categories" },
          ]),
        ]}
      />
      <div className="screen-in hh-page ing-hub">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="ingd-crumb" aria-label="Breadcrumb">
              <Link className="link-inline" href="/tools">Tools</Link>
              <span aria-hidden="true">›</span>
              <Link className="link-inline" href="/tools/ingredient-checker">Ingredient Checker</Link>
              <span aria-hidden="true">›</span>
              <span className="ingd-crumb-cur">Categories</span>
            </nav>
            <h1 className="ingd-h1">Ingredient categories</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              Browse food additives by type to compare halal status across a category, or search any
              E-number or name in the full checker.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {hubs.length === 0 ? (
            <p className="muted">Category pages are being prepared. In the meantime, use the{" "}
              <Link className="link-inline" href="/tools/ingredient-checker">full ingredient checker</Link>.
            </p>
          ) : (
            <ul className="ing-hub-index">
              {hubs.map((h) => (
                <li key={h.slug}>
                  <Link href={`/tools/ingredient-checker/categories/${h.slug}`} className="ing-hub-indexcard">
                    <span className="ing-hub-indexhead">{h.title} <Icon name="arrow" size={16} /></span>
                    <span className="ing-hub-indexintro">{h.intro}</span>
                    <span className="ing-hub-indexcount">{hubMembers(h).length} ingredient guides</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="ing-hub-foot" style={{ marginTop: 26 }}>
            <Link href="/tools/ingredient-checker" className="link-inline">← Back to the full ingredient checker</Link>
          </div>
        </div>
      </div>
    </>
  );
}
