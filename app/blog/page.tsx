import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { allPosts, featuredPost } from "@/lib/blog";
import { getCategory } from "@/lib/blog-categories";
import { SITE, pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { BlogCard } from "@/components/blog/blog-card";
import { CategoryChips } from "@/components/blog/category-chips";
import { BlogNewsletterBand } from "@/components/blog/blog-newsletter-band";
import { SponsoredSlot } from "@/components/sponsored-slot";
import { isUnoptimizedImageSrc } from "@/lib/img";

const featured = featuredPost();

export const metadata: Metadata = pageMeta({
  title: "Halal Guides & Stories — Humble Halal Blog",
  description:
    "Guides to eating halal in Singapore — what halal means, how MUIS certification works, the best halal restaurants and buffets, and more from the Humble Halal team.",
  path: "/blog",
  image: featured.image,
  // Title already carries the brand — without this, the root "%s | Humble
  // Halal" template double-branded it past the ~60-char SERP limit.
  absoluteTitle: true,
});

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export default function Page() {
  const posts = allPosts();
  const rest = posts.filter((p) => p.slug !== featured.slug);
  const featuredCat = getCategory(featured.category);

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Humble Halal Blog",
    url: `${SITE.url}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE.url}/blog/${p.slug}`,
      image: p.image,
      datePublished: p.datePublished,
    })),
  };

  return (
    <>
      <JsonLd data={[blogLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])]} />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Blog</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Halal guides &amp; stories</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              Practical guides to eating halal in Singapore — what halal means, how MUIS certification works, and where to find the best halal food.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {/* Featured / hero post */}
          <Link href={`/blog/${featured.slug}`} className="blog-hero">
            <div className="blog-hero-media">
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                fill
                sizes="(max-width:760px) 100vw, 640px"
                priority
                unoptimized={isUnoptimizedImageSrc(featured.image)}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="blog-hero-body">
              <span className="blog-card-tag">{featuredCat?.name || featured.tags[0]}</span>
              <h2 className="blog-hero-title">{featured.title}</h2>
              <p className="blog-hero-dek">{featured.dek}</p>
              <span className="blog-card-meta">{fmtDate(featured.datePublished)} · {featured.readMins} min read</span>
            </div>
          </Link>

          {/* Category hub */}
          <div className="blog-section" style={{ marginTop: 32 }}>
            <h2 className="blog-hub-heading">Browse by topic</h2>
            <CategoryChips />
          </div>

          {/* Sponsored placement — renders nothing until a campaign is booked */}
          <div className="blog-inline-cta">
            <SponsoredSlot placement="blog_inline" />
          </div>

          {/* Latest posts */}
          {rest.length > 0 && (
            <div className="blog-section" style={{ marginTop: 8 }}>
              <h2 className="blog-hub-heading">Latest guides</h2>
              <div className="blog-grid">
                {rest.map((p) => (
                  <BlogCard key={p.slug} post={p} headingLevel="h3" />
                ))}
              </div>
            </div>
          )}

          {/* Newsletter */}
          <div className="blog-inline-cta">
            <BlogNewsletterBand source="blog" />
          </div>

          {/* SEO copy / funnel links */}
          <div className="blog-section blog-foot-copy">
            <p>
              Every guide here links into the{" "}
              <Link className="link-inline" href="/halal">halal directory</Link> so you can find
              MUIS-verified places near you — or check a specific brand with the{" "}
              <Link className="link-inline" href="/is-halal">is-it-halal brand checker</Link>. New
              guides are added regularly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
