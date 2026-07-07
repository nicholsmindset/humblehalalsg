import type { Metadata } from "next";
import Link from "next/link";
import { getPrayerSpaces, byCategory, PRAYER_CATEGORIES } from "@/lib/prayer-spaces";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { PrayerRoomsDirectory } from "@/components/prayer-rooms-map";

const spaces = getPrayerSpaces();

export const metadata: Metadata = pageMeta({
  title: "Prayer rooms & musollahs in Singapore — malls, MRT, campuses",
  description:
    "A directory of non-mosque prayer spaces (musollah / surau) across Singapore — in shopping malls, transport hubs, attractions, offices, hospitals and campuses. Find a prayer room near you with location, level and facility notes.",
  path: "/prayer-rooms",
  absoluteTitle: true,
});

export default function Page() {
  const groups = PRAYER_CATEGORIES.map((c) => ({ ...c, items: byCategory(c.id) })).filter((g) => g.items.length);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Prayer rooms & musollahs in Singapore",
    numberOfItems: spaces.length,
    itemListElement: spaces.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name })),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Prayer rooms", path: "/prayer-rooms" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="prayer-hero hh-pattern">
          <div className="hh-wrap prayer-hero-grid">
            <div>
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Prayer rooms</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760 }}>Prayer rooms &amp; musollahs in Singapore</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>
              {spaces.length} non-mosque prayer spaces (musollah / surau) across Singapore — in malls, transport hubs,
              attractions, offices, hospitals and campuses. Each listing shows where to find it and what facilities to
              expect. Looking for a masjid instead? See the{" "}
              <Link className="link-inline" href="/mosques">mosque directory</Link>.
            </p>
            <p className="faint" style={{ maxWidth: 680, marginTop: 10, fontSize: ".84rem" }}>
              Prayer rooms open, close and move over time — always confirm on site before you rely on one.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/map?show=prayer-rooms" className="btn btn-primary">
                Find prayer rooms near you on the map →
              </Link>
            </div>
            </div>
            <aside className="prayer-hero-panel" aria-label="Prayer room directory summary">
              <span className="eyebrow" style={{ color: "var(--gold)" }}>Directory snapshot</span>
              <div className="prayer-stat-grid">
                <div><strong>{spaces.length}</strong><span>spaces listed</span></div>
                <div><strong>{groups.length}</strong><span>area groups</span></div>
                <div><strong>Map</strong><span>building-level pins</span></div>
              </div>
              <p>
                Use the cards for level and landmark notes after opening directions. Facilities can change, so confirm at the venue when timing matters.
              </p>
            </aside>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <PrayerRoomsDirectory spaces={spaces} categories={PRAYER_CATEGORIES} />

          <h2 style={{ fontSize: "1.4rem", margin: "8px 0 14px" }}>Related</h2>
          <div className="hub-grid">
            <Link href="/mosques" className="hub-link"><span>Mosques in Singapore</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/prayer-times" className="hub-link"><span>Prayer times today</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/qibla" className="hub-link"><span>Qibla direction finder</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/map?show=prayer-rooms" className="hub-link"><span>Prayer rooms on the live map</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <p className="faint" style={{ fontSize: ".84rem", marginTop: 20 }}>
            Compiled from public community directories. For the most complete, up-to-date list — including newly added or
            relocated spaces — see{" "}
            <a className="link-inline" href="https://www.musollah.sg" target="_blank" rel="noopener noreferrer">MusollahSG</a>{" "}
            and{" "}
            <a className="link-inline" href="https://www.solatgowhere.com" target="_blank" rel="noopener noreferrer">SolatGoWhere</a>.
            Some spaces are unofficial; please pray considerately and keep them clean for others.
          </p>
        </div>
      </div>
    </>
  );
}
