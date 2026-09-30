import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "About Humble Halal",
  description: "Humble Halal publishes practical halal food and Muslim life guides and free tools for readers in Singapore.",
  path: "/about",
});

export default function Page() {
  return (
    <div className="screen-in hh-page">
      <section className="seo-hero hh-pattern"><div className="hh-wrap">
        <span className="eyebrow">About Humble Halal</span>
        <h1>Useful guidance for Muslim life in Singapore.</h1>
        <p className="muted">We publish practical guides about halal food, everyday questions and local Muslim life, alongside free tools for planning and learning.</p>
      </div></section>
      <div className="hh-wrap hh-section" style={{ maxWidth: 800 }}>
        <h2>How to use our guides</h2>
        <p>Our articles are a starting point. Restaurants, ingredients and certification can change. Check the latest details with the business and the relevant official source before relying on a recommendation.</p>
        <p>Humble Halal does not issue halal certification.</p>
        <div className="flex g10 wrap" style={{ marginTop: 24 }}>
          <Link className="btn btn-primary" href="/blog">Browse guides</Link>
          <Link className="btn btn-outline" href="/tools">Use free tools</Link>
        </div>
      </div>
    </div>
  );
}
