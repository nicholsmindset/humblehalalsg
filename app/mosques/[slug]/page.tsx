import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mosqueBySlug, allMosques, mosqueSlug } from "@/lib/mosques";
import { mosqueProfile, profiledMosqueSlugs } from "@/lib/mosque-content";
import { getPrayerTimes } from "@/lib/prayer-times";
import { getDirectory } from "@/lib/directory";
import { locationIdForArea } from "@/lib/seo-pages";
import { qiblaBearing, compassLabel } from "@/lib/qibla";
import { certSuffix } from "@/lib/halal-score";
import { haversineKm, formatKm, directionsUrl } from "@/lib/geo";
import { pageMeta } from "@/lib/seo";
import { JsonLd, mosqueJsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { MapView } from "@/components/map/map-view";
import { Icon } from "@/components/ui";

/* Individual mosque page. Only PROFILED mosques (lib/mosque-content.ts) get a
   page — the thin-content-proof gate. Each renders unique, genuinely useful
   data the Google prayer-time card can't: our own history intro, today's live
   MUIS prayer times, the Jumu'ah explainer, qibla-from-here, a real map +
   directions, and nearby halal food from our directory (the unique moat). */

export const revalidate = 86400; // refresh prayer times daily

export function generateStaticParams() {
  return profiledMosqueSlugs().map((slug) => ({ slug }));
}
export const dynamicParams = false;

function enTitle(name: string) {
  // "Masjid Sultan" → "Masjid Sultan (Sultan Mosque)" for dual masjid/mosque intent.
  const en = name.replace(/^Masjid\s+/i, "");
  return `${name} (${en} Mosque)`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const m = mosqueBySlug(slug);
  const p = mosqueProfile(slug);
  if (!m || !p) return pageMeta({ title: "Mosque in Singapore", path: `/mosques/${slug}` });
  return pageMeta({
    title: `${enTitle(m.name)} — Prayer Times, Jumu'ah & Directions`,
    description: `${m.name} in ${m.area}, Singapore — today's prayer times, Friday (Jumu'ah) info, qibla direction, address, map and directions, plus halal food nearby.`,
    path: `/mosques/${slug}`,
    absoluteTitle: true,
  });
}

const JUMUAH_NOTE =
  "In Singapore, Friday (Jumu'ah) prayers are held around midday. Most mosques run one session; larger mosques offer two. Whether a women's (Muslimah) space is available for Jumu'ah, and the khutbah language, vary by mosque and session — confirm the current details with the mosque or on the MuslimSG app.";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = mosqueBySlug(slug);
  const p = mosqueProfile(slug);
  if (!m || !p) notFound();

  const [times, dir] = await Promise.all([getPrayerTimes(), getDirectory()]);
  const bearing = qiblaBearing(m.coords.lat, m.coords.lng);

  // Nearby halal food — the unique interlink no prayer-time competitor has.
  const nearby = dir
    .filter((l) => l.coords && !l.hawkerCentreId)
    .map((l) => ({ l, km: haversineKm(m.coords, l.coords!) }))
    .filter((x) => x.km <= 2)
    .sort((a, b) => a.km - b.km)
    .slice(0, 6);

  // Other mosques nearby — profiled only (so every link resolves), closest first.
  const nearbyMosques = allMosques()
    .map((o) => ({ o, oslug: mosqueSlug(o) }))
    .filter(({ o, oslug }) => oslug !== slug && !!mosqueProfile(oslug) && !!o.coords)
    .map(({ o, oslug }) => ({ o, oslug, km: haversineKm(m.coords, o.coords) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);

  // /halal-food/[location] link — only when a real area page exists (else the
  // old area.split(" ")[0] guess 404'd, e.g. "kampong", "little", "ang").
  const foodLocation = locationIdForArea(m.area);

  const path = `/mosques/${slug}`;

  return (
    <>
      <JsonLd
        data={[
          mosqueJsonLd({ name: m.name, path, address: p.address ?? `${m.area}, Singapore`, postalCode: p.postal, lat: m.coords.lat, lng: m.coords.lng, image: p.image, builtYear: p.builtYear, facilities: p.facilities, sameAs: p.sameAs }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Mosques", path: "/mosques" },
            { name: m.name, path },
          ]),
          faqJsonLd(p.faqs),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/mosques">Mosques</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{m.name}</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>{enTitle(m.name)}</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>{p.intro}</p>
            <div className="flex g8 wrap" style={{ marginTop: 14, fontSize: ".9rem" }}>
              <span className="tag"><Icon name="pin" size={13} /> {m.area}</span>
              {p.heritage && <span className="tag">{p.heritage}</span>}
              {p.builtYear && <span className="tag">Built {p.builtYear}</span>}
            </div>
          </div>
        </section>

        <div className="hh-wrap detail-body">
          <div className="detail-main">
            {/* Today's prayer times */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Prayer times today {times?.date ? `· ${times.date}` : ""}</h2>
              {times?.times?.length ? (
                <div className="hub-grid" style={{ gap: 8 }}>
                  {times.times.filter((t) => t.name.toLowerCase() !== "syuruk" && t.name.toLowerCase() !== "sunrise").map((t) => (
                    <div key={t.name} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700 }}>{t.name}</span>
                      <span className="muted">{t.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Live prayer times are temporarily unavailable — see <Link className="link-inline" href="/tools/prayer-times">the prayer-times tool</Link>.</p>
              )}
              <p className="faint" style={{ fontSize: ".82rem", marginTop: 8 }}>Times follow the official MUIS timetable for Singapore, updated daily. Full monthly timetable on <Link className="link-inline" href="/tools/prayer-times">the prayer-times tool</Link>, or read our <Link className="link-inline" href="/blog/waktu-solat-singapore">guide to waktu solat in Singapore</Link>.</p>
            </section>

            {/* Jumu'ah */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Friday prayers (Jumu&apos;ah)</h2>
              <p className="muted" style={{ lineHeight: 1.7 }}>{JUMUAH_NOTE}</p>
            </section>

            {/* Facilities */}
            {p.facilities?.length ? (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Facilities</h2>
                <div className="flex g8 wrap">
                  {p.facilities.map((f) => <span key={f} className="tag"><Icon name="check" size={13} /> {f}</span>)}
                </div>
              </section>
            ) : null}

            {/* Qibla */}
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Qibla direction</h2>
              <p className="muted">From {m.name}, the qibla (direction of the Kaaba) is about <strong>{Math.round(bearing)}° ({compassLabel(bearing)})</strong>. Use <Link className="link-inline" href="/tools/qibla">the live qibla compass</Link> to align precisely on your phone.</p>
            </section>

            {/* Nearby halal food — the moat */}
            {nearby.length ? (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Halal food near {m.name}</h2>
                <ul style={{ display: "grid", gap: 12, padding: 0, margin: 0, listStyle: "none" }}>
                  {nearby.map(({ l, km }) => (
                    <li key={l.id} style={{ display: "flex", gap: 12, alignItems: "baseline", borderBottom: "1px solid var(--line)", paddingBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Link href={`/business/${l.slug}`} style={{ fontWeight: 700 }}>{l.name}</Link>
                        <div className="muted" style={{ fontSize: ".9rem", marginTop: 2 }}>
                          {[l.cuisine, l.area].filter(Boolean).join(" · ")}
                          {certSuffix(l) ? ` · ${certSuffix(l)}` : l.badges.includes("owned") ? " · Muslim-owned" : ""}
                        </div>
                      </div>
                      <span className="faint" style={{ fontSize: ".84rem", whiteSpace: "nowrap" }}>{formatKm(km)}</span>
                    </li>
                  ))}
                </ul>
                {foodLocation && (
                  <p style={{ marginTop: 10 }}>
                    <Link className="link" href={`/halal-food/${foodLocation}`}>More halal food in {m.area} <Icon name="arrow" size={14} /></Link>
                  </p>
                )}
              </section>
            ) : null}

            {/* Other mosques nearby — internal-link depth + discovery. */}
            {nearbyMosques.length ? (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Other mosques near {m.name}</h2>
                <ul style={{ display: "grid", gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
                  {nearbyMosques.map(({ o, oslug, km }) => (
                    <li key={oslug} style={{ display: "flex", gap: 12, alignItems: "baseline", borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <Link href={`/mosques/${oslug}`} style={{ fontWeight: 700 }}>{o.name}</Link>
                        <div className="muted" style={{ fontSize: ".9rem", marginTop: 2 }}>{o.area}</div>
                      </div>
                      <span className="faint" style={{ fontSize: ".84rem", whiteSpace: "nowrap" }}>{formatKm(km)}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: 10 }}>
                  <Link className="link" href="/mosques">All mosques in Singapore <Icon name="arrow" size={14} /></Link>
                </p>
              </section>
            ) : null}

            {/* FAQ */}
            <section>
              <h2 style={{ fontSize: "1.3rem", margin: "0 0 12px" }}>Your questions, answered</h2>
              <div className="stack g12">
                {p.faqs.map((f) => (
                  <details key={f.q} className="faq-item">
                    <summary style={{ fontWeight: 600 }}>{f.q}</summary>
                    <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* sidebar: location + directions */}
          <aside className="detail-side">
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Location</h3>
              <p className="muted" style={{ fontSize: ".9rem" }}>{p.address ? `${p.address}${p.postal ? `, Singapore ${p.postal}` : ""}` : `${m.area}, Singapore`}</p>
              {p.nearestMrt && <p className="faint" style={{ fontSize: ".85rem", marginTop: 4 }}><Icon name="pin" size={13} /> {p.nearestMrt}</p>}
              <div style={{ height: 200, borderRadius: 12, marginTop: 12, overflow: "hidden", position: "relative" }}>
                <MapView center={m.coords} zoom={16} points={[{ id: m.id, name: m.name, coords: m.coords, kind: "mosque" as const }]} />
              </div>
              <a className="btn btn-primary btn-block mt12" href={directionsUrl(m.coords)} target="_blank" rel="noopener noreferrer"><Icon name="directions" size={18} /> Directions</a>
              <div className="hub-grid" style={{ gap: 8, marginTop: 12 }}>
                <Link href="/tools/prayer-times" className="hub-link"><span>Prayer times</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
                <Link href="/tools/qibla" className="hub-link"><span>Qibla compass</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
                <Link href="/mosques" className="hub-link"><span>All mosques</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
