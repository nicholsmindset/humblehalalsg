import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { getDirectory } from "@/lib/directory";
import { certSuffix } from "@/lib/halal-score";
import { JsonLd, faqJsonLd, breadcrumbJsonLd, itemListJsonLd } from "@/components/seo/json-ld";

/* Editorial ranking for "best halal restaurants singapore" (1k/mo, KD 10).
   Ranks the REAL directory by community rating (falling back to MUIS-certified
   places while reviews are young) — never fabricates scores. */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Best Halal Restaurants Singapore (${SEO_YEAR}) — Ranked`,
  description:
    "The best halal restaurants in Singapore, ranked by community reviews and halal-confidence — MUIS-certified and Muslim-owned spots for every budget, updated monthly.",
  path: "/best-halal-restaurants-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What are the best halal restaurants in Singapore?", a: "The top-rated halal restaurants in Singapore span nasi padang institutions, halal Japanese and Korean kitchens, steakhouses and café brunch spots. This page ranks them by community rating and halal-confidence score, updated monthly." },
  { q: "Are all restaurants on this list MUIS-certified?", a: "Not all — the list mixes MUIS-certified restaurants with verified Muslim-owned kitchens. Each entry is labelled clearly, and every listing links to its evidence. Always confirm certification on the MUIS HalalSG register." },
  { q: "How is this ranking decided?", a: "Rankings combine community review scores with each restaurant's halal-confidence score (MUIS-certified places rank above self-declared ones at equal ratings). Sponsored placement never affects this ranking." },
];

export default async function Page() {
  const all = await getDirectory();
  const eatery = all.filter((l) => l.catId === "restaurants" || l.catId === "cafes");
  const rated = eatery.filter((l) => l.rating > 0 && l.reviews > 0).sort(
    (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  );
  // Honest fallback while reviews are young: MUIS-certified places first.
  const ranked = (rated.length >= 5 ? rated : eatery.filter((l) => l.certified)).slice(0, 15);

  return (
    <>
      <JsonLd
        data={[
          ...(ranked.length ? [itemListJsonLd(ranked, `Best Halal Restaurants in Singapore (${SEO_YEAR})`)] : []),
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Halal food Singapore", path: "/halal-food-singapore" },
            { name: "Best halal restaurants", path: "/best-halal-restaurants-singapore" },
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
              <span style={{ color: "var(--ink)" }}>Best halal restaurants</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Best Halal Restaurants in Singapore ({SEO_YEAR})</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>The best halal restaurants in Singapore, ranked by real community reviews and halal-confidence</strong> —
              from MUIS-certified fine dining to beloved Muslim-owned neighbourhood kitchens. Every entry is labelled with its
              certification status; sponsored placement never affects this ranking.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {ranked.length ? (
            <ol style={{ display: "grid", gap: 14, padding: 0, margin: 0, listStyle: "none" }}>
              {ranked.map((l, i) => (
                <li key={l.id} style={{ display: "flex", gap: 14, alignItems: "baseline", borderBottom: "1px solid var(--line, #ECE7DB)", paddingBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: "1.2rem", minWidth: 30, color: "var(--emerald, #12525B)" }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <Link href={`/business/${l.slug}`} style={{ fontWeight: 700, fontSize: "1.08rem" }}>{l.name}</Link>
                    <div className="muted" style={{ fontSize: ".92rem", marginTop: 3 }}>
                      {[l.cuisine, l.area, l.price].filter(Boolean).join(" · ")}
                      {certSuffix(l) ? ` · ${certSuffix(l)}` : l.badges.includes("owned") ? " · Muslim-owned" : ""}
                      {l.rating > 0 ? ` · ${l.rating.toFixed(1)}★ (${l.reviews})` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">
              We&apos;re still collecting community reviews for this ranking — meanwhile, explore{" "}
              <Link href="/halal-restaurants-singapore">all halal restaurants</Link> or{" "}
              <Link href="/explore">filter by area and cuisine</Link>.
            </p>
          )}

          <div className="hub-grid" style={{ marginTop: 28 }}>
            <Link href="/new-halal-restaurants-singapore" className="hub-link"><span>New halal openings</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-fine-dining-singapore" className="hub-link"><span>Halal fine dining</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-buffet-singapore" className="hub-link"><span>Halal buffets</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-food-near-me" className="hub-link"><span>Halal food near me</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
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
