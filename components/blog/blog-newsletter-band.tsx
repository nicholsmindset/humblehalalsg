/* The blog newsletter CTA band. Wraps the shared <Newsletter> client island in
   the lead-magnet copy used across the blog (index, category, end-of-post) so the
   pitch stays consistent. Server component. */
import { Newsletter } from "@/components/newsletter";

export function BlogNewsletterBand({
  source = "blog",
  cta = "Send me the guide",
}: {
  source?: string;
  cta?: string;
}) {
  return (
    <section className="newsletter-card blog-nl-band">
      <span className="eyebrow" style={{ color: "var(--emerald)" }}>
        🌙 HumbleHalal newsletter
      </span>
      <strong style={{ display: "block", fontSize: "1.2rem", marginTop: 8 }}>
        Get the free Ultimate Halal Food Guide by MRT
      </strong>
      <p className="muted" style={{ margin: "6px 0 14px", maxWidth: 560 }}>
        Subscribe for weekly MUIS-verified food finds, mosque events &amp; deals across Singapore — and
        we&apos;ll email you the guide.
      </p>
      <Newsletter source={source} variant="card" cta={cta} />
    </section>
  );
}
