import { GuideFinder } from "@/components/blog/guide-finder";
import { guideCard } from "@/lib/blog-discovery";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { allBlogPosts, featuredBlogPost } from "@/lib/cms-blog";
import { getCategory } from "@/lib/blog-categories";
import { SITE, pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CategoryChips } from "@/components/blog/category-chips";
import { BlogNewsletterBand } from "@/components/blog/blog-newsletter-band";
import { isUnoptimizedImageSrc } from "@/lib/img";

export async function generateMetadata(): Promise<Metadata> {
  const featured = await featuredBlogPost();
  return pageMeta({
    title: "Halal Guides & Stories — Humble Halal Blog",
    description:
      "Guides to eating halal in Singapore — what halal means, how MUIS certification works, the best halal restaurants and buffets, and more from the Humble Halal team.",
    path: "/blog",
    image: featured.image,
    absoluteTitle: true,
  });
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export default async function Page() {
  const posts = await allBlogPosts();
  const featured = posts[0];
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
      <div className="screen-in hh-page blog-index">
        <section className="blog-index-head">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Blog</span>
            </nav>
            <span className="eyebrow">The Humble Halal blog</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Halal guides &amp; stories</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              Find your next meal, explore a neighbourhood, or get a clear answer to an everyday halal question.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <GuideFinder posts={posts.map(guideCard)} featuredSlug={featured.slug} categories={<CategoryChips />} featured={
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
              <span className="editorial-read-more">Read the guide <span aria-hidden="true">→</span></span>
            </div>
          </Link>

          } />

          {/* Newsletter */}
          <div className="blog-inline-cta">
            <BlogNewsletterBand source="blog" />
          </div>

          {/* SEO copy / funnel links */}
          <div className="blog-section blog-foot-copy">
            <p>
              Use these guides to plan and explore, and check time-sensitive details directly before you visit.
              For practical help with prayer, Quran and everyday questions, explore our{" "}
              <Link className="link-inline" href="/tools">free tools</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
