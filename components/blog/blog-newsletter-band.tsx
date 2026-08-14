/* The blog newsletter CTA band. Wraps the shared <Newsletter> client island in
   the lead-magnet copy used across the blog (index, category, end-of-post) so the
   pitch stays consistent. Server component. */
import { Newsletter } from "@/components/newsletter";

export function BlogNewsletterBand({
  source = "blog",
  cta = "Email me the planner",
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
        Plan your halal weekend in 10 minutes
      </strong>
      <p className="muted" style={{ margin: "6px 0 14px", maxWidth: 560 }}>
        Get a reusable food, prayer and activity worksheet now, plus one useful Humble Halal email each Friday.
      </p>
      <Newsletter
        source={source}
        variant="card"
        cta={cta}
        successHref="/guides/halal-weekend-planner-singapore.pdf"
        successCta="Open the planner now"
      />
    </section>
  );
}
