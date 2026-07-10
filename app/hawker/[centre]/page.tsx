import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerFlags } from "@/lib/feature-flags";
import { getHawkerCentre, getStallsForCentre } from "@/lib/hawker";
import { pageMeta } from "@/lib/seo";
import { mapsSearchUrl } from "@/lib/geo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { HawkerMap } from "@/components/hawker-map";
import { HalalConfidenceBadge } from "@/components/halal-confidence-badge";
import { scoreListing } from "@/lib/halal-score";

// Flag-gated: render on demand so a hawkerFinder toggle reflects immediately
// (a prerendered notFound() would otherwise stay cached after the flag flips).
// Low page count + low traffic, so on-demand rendering is fine; still SSR'd for SEO.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ centre: string }> }): Promise<Metadata> {
  const { centre } = await params;
  const c = await getHawkerCentre(centre);
  if (!c) return pageMeta({ title: "Hawker centre", path: `/hawker/${centre}`, index: false });
  return pageMeta({
    title: `Halal stalls at ${c.name}`,
    description: `Halal and Muslim-owned stalls at ${c.name}${c.address ? `, ${c.address}` : ""}, Singapore — with trust signals and a Halal Confidence Score. Always confirm on site.`,
    path: `/hawker/${c.id}`,
  });
}

export default async function Page({ params }: { params: Promise<{ centre: string }> }) {
  if (!(await getServerFlags()).hawkerFinder) notFound();
  const { centre } = await params;
  const c = await getHawkerCentre(centre);
  if (!c) notFound();
  const stalls = await getStallsForCentre(c.id);

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Hawker Finder", path: "/hawker" }, { name: c.name, path: `/hawker/${c.id}` }]),
        { "@context": "https://schema.org", "@type": "ItemList", name: `Halal stalls at ${c.name}`, numberOfItems: stalls.length, itemListElement: stalls.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name })) },
      ]} />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/hawker">Hawker Finder</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{c.name}</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.6rem,3.6vw,2.3rem)", maxWidth: 760 }}>Halal stalls at {c.name}</h1>
            <div className="prayer-card-meta" style={{ marginTop: 10 }}>
              {c.region && <span className="prayer-chip">{c.region}</span>}
              {stalls.length > 0 && <span className="prayer-card-type">{stalls.length} halal stall{stalls.length === 1 ? "" : "s"}</span>}
              {c.nearestMrt && <span className="prayer-chip">Near {c.nearestMrt}</span>}
              {c.hours && <span className="prayer-chip">{c.hours}</span>}
            </div>
            {c.address && (
              <p className="muted" style={{ marginTop: 10 }}>
                {c.address} · <a className="link-inline" href={mapsSearchUrl(`${c.name} Singapore`)} target="_blank" rel="noopener noreferrer">Directions →</a>
              </p>
            )}
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {c.lat != null && (
            <div style={{ marginBottom: 22 }}><HawkerMap centres={[c]} height="clamp(260px, 40vh, 360px)" /></div>
          )}

          {stalls.length === 0 ? (
            <div className="card" style={{ padding: 26, textAlign: "center" }}>
              <p className="muted">No halal stalls listed here yet.</p>
              <p className="faint" style={{ marginTop: 6, fontSize: ".85rem" }}>Know one? <Link className="link-inline" href="/suggest">Suggest a stall →</Link></p>
            </div>
          ) : (
            <div className="hub-grid">
              {stalls.map((s) => (
                <Link key={s.id} href={`/business/${s.slug}`} className="prayer-card" style={{ textDecoration: "none" }}>
                  <div className="prayer-card-name">{s.name}</div>
                  <div className="prayer-card-meta">
                    {s.stallNo && <span className="prayer-chip">{s.stallNo}</span>}
                    {s.cuisine && <span className="prayer-card-type">{s.cuisine}</span>}
                  </div>
                  <div style={{ margin: "8px 0 4px" }}><HalalConfidenceBadge item={s} /></div>
                  {s.blurb && <div className="prayer-card-notes">{s.blurb}</div>}
                  <div className="prayer-card-foot">
                    {/* Same tier label as the badge above — the old certified?
                        "MUIS / verified":"Self-declared" caption contradicted it
                        (community-verified stalls read "Self-declared"). */}
                    <span className="prayer-card-src">{scoreListing(s).label}</span>
                    <span className="prayer-card-dir">View stall →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="faint" style={{ fontSize: ".84rem", marginTop: 20 }}>
            A discovery platform, not a certifier. Always verify certification on{" "}
            <a className="link-inline" href="https://www.halalcert.muis.gov.sg" target="_blank" rel="noopener noreferrer">MUIS HalalSG</a>.
          </p>
        </div>
      </div>
    </>
  );
}
