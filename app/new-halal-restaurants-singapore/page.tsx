import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { getDirectory } from "@/lib/directory";
import { certSuffix } from "@/lib/halal-score";
import { JsonLd, faqJsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/json-ld";

/* Freshness hub for "new halal restaurants singapore" (400/mo, KD 5).
   Surfaces the most recently added listings (businesses.created_at) —
   revalidated daily so the page stays genuinely fresh. */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `New Halal Restaurants Singapore (${SEO_YEAR}) — Latest Openings`,
  description:
    "The newest halal restaurants and Muslim-owned openings in Singapore — updated as new places are verified and added, each with a halal-confidence score.",
  path: "/new-halal-restaurants-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What new halal restaurants have opened in Singapore?", a: "This page tracks the newest halal restaurants and Muslim-owned food businesses added to the Humble Halal directory — updated as places are verified. Each entry shows its halal status and confidence score." },
  { q: "How often is this list updated?", a: "Continuously — as soon as a new halal place is verified and published in the directory, it appears here. Check back monthly for the latest openings." },
  { q: "How can I add a new halal restaurant?", a: "Know a new opening we've missed? Suggest it via the Add Your Business page — our team verifies halal status before it goes live." },
];

const monthYear = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-SG", { month: "long", year: "numeric" });
};

export default async function Page() {
  const all = await getDirectory();
  const fresh = all
    .filter((l) => (l.catId === "restaurants" || l.catId === "cafes") && l.createdAt)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 12);

  return (
    <>
      <JsonLd
        data={[
          ...(fresh.length ? [itemListJsonLd(fresh, `New Halal Restaurants in Singapore (${SEO_YEAR})`)] : []),
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Halal food Singapore", path: "/halal-food-singapore" },
            { name: "New halal restaurants", path: "/new-halal-restaurants-singapore" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <Link className="link-inline" href="/halal-food-singapore">Halal food</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>New openings</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>New Halal Restaurants in Singapore ({SEO_YEAR})</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>The latest halal restaurants and Muslim-owned openings in Singapore</strong>, freshly verified and added
              to the directory — each labelled MUIS Certified, Muslim-Owned or self-declared, with a halal-confidence score.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {fresh.length ? (
            <ul style={{ display: "grid", gap: 14, padding: 0, margin: 0, listStyle: "none" }}>
              {fresh.map((l) => (
                <li key={l.id} style={{ display: "flex", gap: 14, alignItems: "baseline", borderBottom: "1px solid var(--line, #ECE7DB)", paddingBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <Link href={`/business/${l.slug}`} style={{ fontWeight: 700, fontSize: "1.08rem" }}>{l.name}</Link>
                    <div className="muted" style={{ fontSize: ".92rem", marginTop: 3 }}>
                      {[l.cuisine, l.area, l.price].filter(Boolean).join(" · ")}
                      {certSuffix(l) ? ` · ${certSuffix(l)}` : l.badges.includes("owned") ? " · Muslim-owned" : ""}
                      {monthYear(l.createdAt) ? ` · added ${monthYear(l.createdAt)}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              New verified openings will appear here as they&apos;re added. Meanwhile, explore{" "}
              <Link href="/best-halal-restaurants-singapore">the best halal restaurants</Link> or{" "}
              <Link href="/explore">browse the full directory</Link>.
            </p>
          )}

          <div className="hub-grid" style={{ marginTop: 28 }}>
            <Link href="/best-halal-restaurants-singapore" className="hub-link"><span>Best halal restaurants {SEO_YEAR}</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-food-near-me" className="hub-link"><span>Halal food near me</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/add-listing" className="hub-link"><span>Add a new halal place</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Your questions, answered</h2>
          <div className="stack g12">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary style={{ fontWeight: 600 }}>{f.q}</summary>
                <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
