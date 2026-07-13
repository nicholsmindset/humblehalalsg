/* Humble Halal — home long-form SEO content. Targets the food head cluster
   (halal food near me / halal food singapore / halal restaurants singapore)
   with internal links to the programmatic /halal pages. Golden rule: surface
   facts, never assert certification. Rendered as visible H2/H3 + prose (was
   collapsed <details>, which buried the content from crawlers + readers). */
import Link from "next/link";

export function HomeSeoContent() {
  return (
    <section className="hh-wrap hh-section home-seo" style={{ textAlign: "center" }}>
      <h2 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Halal food in Singapore — the full picture</h2>
      <p className="muted" style={{ maxWidth: 680, margin: "0 auto 20px" }}>How to find halal food near you, what the badges mean, and where to start by area, cuisine and prayer needs.</p>
      <div className="home-seo-prose" style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 22, textAlign: "left" }}>
        <div>
          <h3 style={{ fontSize: "1.18rem", marginBottom: 8 }}>Finding halal food near you</h3>
          <p className="muted">
            Humble Halal helps you find halal restaurants, cafés and Muslim-owned businesses across Singapore. Open the{" "}
            <Link href="/map">map view and tap “Near me”</Link> to sort by distance, or browse{" "}
            <Link href="/halal">halal food by area</Link> — Tampines, Bugis, Geylang Serai, Bedok, Jurong and more — and filter
            by prayer space, family-friendly and open-now. Every listing carries a halal-confidence score so you can judge at a
            glance.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: "1.18rem", marginBottom: 8 }}>MUIS-certified vs Muslim-friendly — what the badges mean</h3>
          <p className="muted">
            Not everything listed is halal-certified, and we make the difference unmistakable. A{" "}
            <strong>MUIS Certified</strong> badge means the establishment holds a valid certificate from Singapore's official
            authority (we link to its HalalSG verification). <strong>Halal-Friendly</strong> or <strong>No Pork No Lard</strong>{" "}
            are self-declared by the business and labelled “not certified.” Humble Halal is a discovery platform, not a certifier
            — see <Link href="/verify">how our badges work</Link> and always confirm on the MUIS HalalSG register.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: "1.18rem", marginBottom: 8 }}>Browse by cuisine</h3>
          <p className="muted">
            Craving something specific? Explore <Link href="/halal/halal-buffet-singapore">halal buffets</Link>,{" "}
            <Link href="/halal/halal-sushi-singapore">halal sushi &amp; Japanese</Link>,{" "}
            <Link href="/halal/halal-korean-singapore">halal Korean</Link>,{" "}
            <Link href="/halal/halal-fine-dining-singapore">halal fine dining</Link> and{" "}
            <Link href="/halal/halal-high-tea-singapore">halal high tea</Link> — each a curated guide to the best spots in
            Singapore.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: "1.18rem", marginBottom: 8 }}>Prayer spaces, prayer times &amp; halal travel</h3>
          <p className="muted">
            Many listings show prayer-space details — gender arrangement, wudhu facilities and whether mats are provided — and
            the prayer-times strip shows the nearest mosque. Find <Link href="/mosques">mosques near you</Link>, daily{" "}
            <Link href="/tools">prayer times and Deen tools</Link>, and when you travel, Muslim-friendly hotels and flights on{" "}
            <Link href="/travel">Humble Halal Travel</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
