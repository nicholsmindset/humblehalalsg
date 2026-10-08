import { EditorialAd } from "@/components/ads/editorial-ad";
import Link from "next/link";
import Image from "next/image";
import { allBlogPosts } from "@/lib/cms-blog";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogNewsletterBand } from "@/components/blog/blog-newsletter-band";
import { isUnoptimizedImageSrc } from "@/lib/img";
import { pageMeta } from "@/lib/seo";
import "../styles/blog.css";
import "../styles/editorial-home.css";

export const metadata = pageMeta({
  title: "Humble Halal — Guides & Tools for Muslims in Singapore",
  description: "Halal food guides, Muslim life stories and practical Islamic tools for Singapore. Explore articles and get the Friday email.",
  path: "/",
  absoluteTitle: true,
});

const topics = [
  { title: "Where to eat", description: "Restaurants, cafés and cuisines worth exploring.", href: "/blog/category/restaurants-cafes", icon: "🍽️" },
  { title: "By neighbourhood", description: "Food guides for Singapore's malls and districts.", href: "/blog/category/areas-malls", icon: "📍" },
  { title: "Halal basics", description: "Understand certification and check with confidence.", href: "/blog/category/halal-basics", icon: "✓" },
  { title: "Muslim life", description: "Prayer, celebrations and useful everyday guides.", href: "/blog/category/prayers-deen", icon: "☾" },
];

export default async function Page() {
  const posts = await allBlogPosts();
  const [featured, ...latest] = posts;

  return (
    <div className="hh-page editorial-home">
      <section className="editorial-hero hh-wrap">
        <div className="editorial-hero-copy">
          <span className="eyebrow">Made for Muslim life in Singapore</span>
          <h1>Your guide to halal Singapore.</h1>
          <p>Find your next meal, understand halal, and make everyday Muslim life a little easier.</p>
          <div className="editorial-hero-actions">
            <Link className="btn btn-primary btn-lg" href="/blog">Read the guides</Link>
            <Link className="btn btn-outline btn-lg" href="/tools">Explore tools</Link>
          </div>
          <nav className="editorial-quick-links" aria-label="Popular guide topics"><Link href="/blog/category/restaurants-cafes">Where to eat</Link><Link href="/blog/category/halal-basics">Halal basics</Link><Link href="/blog#find-guides">Find a guide →</Link></nav>
        </div>
        {featured && (
          <Link className="editorial-feature" href={`/blog/${featured.slug}`}>
            <div className="editorial-feature-image">
              <Image src={featured.image} alt={featured.imageAlt || featured.title} fill priority sizes="(max-width: 760px) 100vw, 48vw" unoptimized={isUnoptimizedImageSrc(featured.image)} />
            </div>
            <div className="editorial-feature-content">
              <span className="eyebrow">Featured guide</span>
              <h2>{featured.title}</h2>
              <p>{featured.dek}</p>
              <span className="editorial-read-more">Read the guide →</span>
            </div>
          </Link>
        )}
      </section>

      <div className="hh-wrap"><EditorialAd placement="home-after-featured" /></div>

      <section className="editorial-section hh-wrap" aria-labelledby="topics-heading">
        <div className="editorial-section-head">
          <div><span className="eyebrow">Start here</span><h2 id="topics-heading">What would you like to explore?</h2></div>
          <Link href="/blog">All guides →</Link>
        </div>
        <div className="editorial-topics">
          {topics.map((topic, index) => (
            <Link key={topic.href} className="editorial-topic" href={topic.href}>
              <span className="editorial-topic-number" aria-hidden="true">0{index + 1}</span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      {latest.length > 0 && (
        <section className="editorial-section hh-wrap" aria-labelledby="latest-heading">
          <div className="editorial-section-head">
            <div><span className="eyebrow">Fresh reads</span><h2 id="latest-heading">Latest from Humble Halal</h2></div>
            <Link href="/blog">Browse the blog →</Link>
          </div>
          <div className="blog-grid">{latest.slice(0, 6).map((post) => <BlogCard key={post.slug} post={post} headingLevel="h3" />)}</div>
        </section>
      )}

      <div className="hh-wrap"><EditorialAd placement="home-after-guides" /></div>

      <section className="editorial-tools editorial-section" aria-labelledby="tools-heading">
        <div className="hh-wrap editorial-tools-inner">
          <div>
            <span className="eyebrow">Useful every day</span>
            <h2 id="tools-heading">Practical tools, ready when you need them.</h2>
            <p>Check prayer times, read Quran, explore duas and use more free tools built for everyday Muslim life.</p>
            <Link className="btn btn-primary" href="/tools">See all tools →</Link>
          </div>
          <div className="editorial-tool-links">
            <Link href="/tools/prayer-times">Prayer times <span>→</span></Link>
            <Link href="/tools/quran">Quran reader <span>→</span></Link>
            <Link href="/tools/duas">Dua library <span>→</span></Link>
            <Link href="/tools/ingredient-checker">Ingredient checker <span>→</span></Link>
          </div>
        </div>
      </section>

      <div className="editorial-section hh-wrap"><BlogNewsletterBand source="home" cta="Get the Friday email" /></div>
    </div>
  );
}
