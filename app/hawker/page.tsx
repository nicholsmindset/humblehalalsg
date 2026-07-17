import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerFlags } from "@/lib/feature-flags";
import { getHawkerCentres, getStallAggregates, getPopularStalls, centresByRegion, HAWKER_REGIONS } from "@/lib/hawker";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { HawkerFinder } from "@/components/hawker/finder";
import { Icon, ImagePh } from "@/components/ui";
import { Newsletter } from "@/components/newsletter";

// Flag-gated: render on every request so an admin toggle of hawkerFinder is
// reflected immediately (no stale ISR 404 lingering after the flag flips on).
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Halal Hawker Finder — halal stalls by hawker centre in Singapore",
  description:
    "Find halal food at Singapore's hawker centres. Browse Muslim-owned and halal-friendly stalls grouped by centre — Geylang Serai, Maxwell, Tekka and more — with trust signals and a Halal Confidence Score.",
  path: "/hawker",
  absoluteTitle: true,
});

const VERIFY_STEPS = [
  { icon: "doc", title: "1. Official sources", text: "We cross-check with MUIS HalalSG, NEA and operator information." },
  { icon: "users", title: "2. Community checks", text: "Our community helps confirm halal status and update operations." },
  { icon: "refresh", title: "3. Regular updates", text: "We review listings regularly to keep information accurate and current." },
];

export default async function Page() {
  if (!(await getServerFlags()).hawkerFinder) notFound();

  const [centres, aggregates, popular] = await Promise.all([
    getHawkerCentres(),
    getStallAggregates(),
    getPopularStalls(12),
  ]);
  const groups = HAWKER_REGIONS
    .map((r) => ({ ...r, items: centresByRegion(centres, r.id) }))
    .filter((g) => g.items.length);
  const total = centres.length;
  const stallTotal = Object.values(aggregates).reduce((a, b) => a + b.count, 0);

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
            <span className="eyebrow">Singapore hawker guide</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760, marginTop: 8 }}>Find halal hawker food near you</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>
              {stallTotal > 0
                ? `Explore ${stallTotal} halal and Muslim-owned stalls across ${total} hawker centres in Singapore.`
                : `${total} hawker centres in Singapore.`}
            </p>
            <p className="faint" style={{ marginTop: 8, fontSize: ".84rem", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="shield-check" size={14} /> Community-sourced · Always verify on site
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {centres.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <p className="muted">No hawker centres yet — check back soon.</p>
            </div>
          ) : (
            <HawkerFinder
              centres={centres}
              aggregates={aggregates}
              regions={HAWKER_REGIONS.map(({ id, label }) => ({ id, label }))}
            />
          )}

          {groups.length > 0 && (
            <section style={{ marginTop: 34 }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: 14 }}>Browse by region</h2>
              <div className="hk-region-grid">
                {groups.map((g) => (
                  <Link key={g.id} href={`/hawker#${g.id}`} className="hk-region-card">
                    <span className="hk-monogram" aria-hidden="true">{g.label[0]}</span>
                    <strong>{g.label}</strong>
                    <span className="faint">{g.items.length} centre{g.items.length === 1 ? "" : "s"}</span>
                    <span className="hk-view">Explore →</span>
                  </Link>
                ))}
                <Link href="/suggest" className="hk-region-card hk-region-suggest">
                  <span className="hk-monogram" aria-hidden="true">+</span>
                  <strong>Don’t see your area?</strong>
                  <span className="faint">Help us grow the map</span>
                  <span className="hk-view">Suggest a centre →</span>
                </Link>
              </div>
            </section>
          )}

          {popular.length > 0 && (
            <section style={{ marginTop: 34 }}>
              <div className="flex between center wrap g10" style={{ marginBottom: 14 }}>
                <h2 style={{ fontSize: "1.35rem", margin: 0 }}>Popular halal hawker stalls</h2>
                <Link className="link-inline" href="/explore">View all stalls →</Link>
              </div>
              <div className="hk-carousel" role="list">
                {popular.map(({ stall, centreName }) => (
                  <Link key={stall.id} href={`/business/${stall.slug || stall.id}`} className="hk-stall-card" role="listitem">
                    <div className="hk-stall-photo">
                      <ImagePh src={stall.image} label={stall.name} ratio="4/3" />
                      {stall.badges?.includes("muis") && <span className="hk-stall-muis">MUIS</span>}
                    </div>
                    <div className="hk-stall-body">
                      <strong>{stall.name}</strong>
                      {stall.cuisine && <span className="faint">{stall.cuisine}</span>}
                      <span className="hk-stall-meta">
                        {[centreName, stall.stallNo && `#${String(stall.stallNo).replace(/^#/, "")}`].filter(Boolean).join(" · ")}
                      </span>
                      <span className="hk-stall-foot">
                        {stall.badges?.includes("muis") ? (
                          <><Icon name="badge-check" size={13} /> MUIS certified</>
                        ) : stall.badges?.includes("owned") ? (
                          <><Icon name="users" size={13} /> Muslim-owned</>
                        ) : (
                          <><Icon name="shield-check" size={13} /> Community-verified</>
                        )}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="hk-verify" style={{ marginTop: 34 }}>
            <div className="flex between center wrap g12">
              <h2 style={{ fontSize: "1.2rem", margin: 0 }}>How Humble Halal verifies hawker listings</h2>
              <Link className="btn btn-outline btn-sm" href="/verify">Learn how we verify →</Link>
            </div>
            <div className="hk-verify-grid">
              {VERIFY_STEPS.map((s) => (
                <div key={s.title} className="hk-verify-step">
                  <span className="tool-card-ico"><Icon name={s.icon} size={20} /></span>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="newsletter-card" style={{ marginTop: 30 }}>
            <span className="eyebrow">The weekly halal guide</span>
            <h2 style={{ fontSize: "1.25rem", margin: "6px 0 10px" }}>Tips, new finds and updates — straight to your inbox.</h2>
            <Newsletter source="hawker" cta="Subscribe" />
          </section>

          <h2 style={{ fontSize: "1.3rem", margin: "30px 0 14px" }}>Related</h2>
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
