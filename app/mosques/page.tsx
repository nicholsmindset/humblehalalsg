import type { Metadata } from "next";
import Link from "next/link";
import { mosques } from "@/lib/data";
import type { Mosque } from "@/lib/types";
import { mapsSearchUrl } from "@/lib/geo";
import { mosqueSlug } from "@/lib/mosques";
import { mosqueProfile } from "@/lib/mosque-content";
import { SITE, pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMeta({
  title: "Mosques in Singapore (Masjid) — Directory, Prayer Times & Jumu'ah",
  description:
    "Every masjid (mosque) in Singapore, grouped by region — with prayer times, Friday (Jumu'ah) info, qibla and directions. Find a masjid near you in Central, East, North-East, North or West.",
  path: "/mosques",
  absoluteTitle: true,
});

const REGION_ORDER: Mosque["region"][] = ["Central", "East", "North-East", "North", "West"];
const REGION_SLUG: Record<Mosque["region"], string> = {
  Central: "central",
  East: "east",
  "North-East": "north-east",
  North: "north",
  West: "west",
};

export default function Page() {
  const grouped = REGION_ORDER.map((r) => ({
    region: r,
    items: mosques.filter((m) => m.region === r).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Mosques in Singapore",
    numberOfItems: mosques.length,
    itemListElement: mosques.map((m, i) => {
      const slug = mosqueSlug(m);
      // Link items that have a real detail page (all profiled mosques).
      const url = mosqueProfile(slug) ? `${SITE.url}/mosques/${slug}` : undefined;
      return { "@type": "ListItem", position: i + 1, name: m.name, ...(url ? { url } : {}) };
    }),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Mosques", path: "/mosques" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Mosques</span>
            </div>
            <span className="eyebrow">Mosque finder</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Mosques in Singapore</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              {mosques.length} mosques (masjid) across Singapore, grouped by region. Find one near you, get directions,
              or open the live map to see the mosques nearest you.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/map?show=mosques" className="btn btn-primary">
                Find mosques near you on the map →
              </Link>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: ".92rem" }}>
              Looking for a musollah instead? See{" "}
              <Link className="link-inline" href="/prayer-rooms">prayer rooms in malls, MRT &amp; more →</Link>
            </p>
            {/* Jump-nav: keeps a long list scannable */}
            <nav className="mosque-jump" aria-label="Jump to region">
              {grouped.map((g) => (
                <a key={g.region} href={`#${REGION_SLUG[g.region]}`} className="mosque-jump-link">
                  {g.region} <span>{g.items.length}</span>
                </a>
              ))}
            </nav>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {grouped.map((g) => (
            <section key={g.region} id={REGION_SLUG[g.region]} className="mosque-region">
              <h2 className="mosque-region-h">
                {g.region}
                <span className="mosque-region-count">{g.items.length} mosques</span>
              </h2>
              <div className="hub-grid">
                {g.items.map((m) => {
                  // Profiled mosques have a rich detail page; others link to the map.
                  const slug = mosqueSlug(m);
                  const profiled = !!mosqueProfile(slug);
                  return (
                    <div key={m.id} className="mosque-row">
                      <div style={{ minWidth: 0 }}>
                        {profiled ? (
                          <Link href={`/mosques/${slug}`} className="mosque-row-name link-inline">{m.name}</Link>
                        ) : (
                          <div className="mosque-row-name">{m.name}</div>
                        )}
                        <div className="mosque-row-area">{m.area}</div>
                      </div>
                      {profiled ? (
                        <Link className="mosque-row-dir" href={`/mosques/${slug}`}>Details →</Link>
                      ) : (
                        <a
                          className="mosque-row-dir"
                          href={mapsSearchUrl(`${m.name} Singapore`)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Map →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          <p className="faint" style={{ fontSize: ".84rem", marginTop: 8 }}>
            Every mosque (masjid) on mainland Singapore — the offshore Masjid Pulau Bukom is the only one not listed.
            Always confirm prayer times and details with the mosque or on{" "}
            <a className="link-inline" href="https://www.muis.gov.sg/mosque/Our-Mosques/Mosque-Directory" target="_blank" rel="noopener noreferrer">
              the official MUIS mosque directory
            </a>
            . Source: community + public information.
          </p>
        </div>
      </div>
    </>
  );
}
