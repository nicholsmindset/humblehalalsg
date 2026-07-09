import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerFlags } from "@/lib/feature-flags";
import { getHawkerCentres, getStallCounts, centresByRegion, HAWKER_REGIONS } from "@/lib/hawker";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { HawkerMap } from "@/components/hawker-map";

export const metadata: Metadata = pageMeta({
  title: "Halal Hawker Finder — halal stalls by hawker centre in Singapore",
  description:
    "Find halal food at Singapore's hawker centres. Browse Muslim-owned and halal-friendly stalls grouped by centre — Geylang Serai, Maxwell, Tekka and more — with trust signals and a Halal Confidence Score.",
  path: "/hawker",
  absoluteTitle: true,
});

export default async function Page() {
  if (!(await getServerFlags()).hawkerFinder) notFound();

  const [centres, counts] = await Promise.all([getHawkerCentres(), getStallCounts()]);
  const groups = HAWKER_REGIONS
    .map((r) => ({ ...r, items: centresByRegion(centres, r.id) }))
    .filter((g) => g.items.length);
  const total = centres.length;
  const stallTotal = Object.values(counts).reduce((a, b) => a + b, 0);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Halal hawker centres in Singapore",
    numberOfItems: total,
    itemListElement: centres.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name })),
  };

  return (
    <>
      <JsonLd data={[itemList, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hawker Finder", path: "/hawker" }])]} />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Hawker Finder</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760 }}>Halal Hawker Finder</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>
              {stallTotal > 0 ? `${stallTotal} halal stalls across ${total} hawker centres` : `${total} hawker centres`} in Singapore — Muslim-owned and
              halal-friendly stalls grouped by centre, each with trust signals and a Halal Confidence Score. Always confirm on site.
            </p>
            {stallTotal > 0 && (
              <div style={{ marginTop: 16 }}>
                <Link href="/explore?cat=hawker" className="btn btn-primary">Find halal hawker stalls near you →</Link>
              </div>
            )}
            {groups.length > 1 && (
              <nav className="mosque-jump" aria-label="Jump to region">
                {groups.map((g) => (
                  <a key={g.id} href={`#${g.id}`} className="mosque-jump-link">{g.label} <span>{g.items.length}</span></a>
                ))}
              </nav>
            )}
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {centres.some((c) => c.lat != null) && (
            <>
              <HawkerMap centres={centres} />
              <p className="faint" style={{ fontSize: ".82rem", margin: "8px 0 26px" }}>Pins are centre-level — tap one, then browse its halal stalls.</p>
            </>
          )}

          {groups.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <p className="muted">No hawker centres yet — check back soon.</p>
            </div>
          ) : groups.map((g) => (
            <section key={g.id} id={g.id} className="mosque-region">
              <h2 className="mosque-region-h">{g.label}<span className="mosque-region-count">{g.items.length} centres</span></h2>
              <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: ".92rem" }}>{g.blurb}</p>
              <div className="hub-grid">
                {g.items.map((c) => (
                  <Link key={c.id} href={`/hawker/${c.id}`} className="prayer-card" style={{ textDecoration: "none" }}>
                    <div className="prayer-card-name">{c.name}</div>
                    <div className="prayer-card-meta">
                      {c.region && <span className="prayer-chip">{c.region}</span>}
                      {counts[c.id] ? <span className="prayer-card-type">{counts[c.id]} halal stall{counts[c.id] === 1 ? "" : "s"}</span> : null}
                    </div>
                    {c.address && <div className="prayer-card-loc">{c.address}</div>}
                    <div className="prayer-card-notes">{[c.nearestMrt && `Near ${c.nearestMrt}`, c.hours].filter(Boolean).join(" · ")}</div>
                    <div className="prayer-card-foot">
                      {c.source && <span className="prayer-card-src">{c.source}</span>}
                      <span className="prayer-card-dir">View stalls →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <h2 style={{ fontSize: "1.4rem", margin: "8px 0 14px" }}>Related</h2>
          <div className="hub-grid">
            <Link href="/explore" className="hub-link"><span>All halal businesses</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/prayer-rooms" className="hub-link"><span>Prayer rooms near hawker centres</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/is-halal" className="hub-link"><span>Is it halal? checker</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </>
  );
}
