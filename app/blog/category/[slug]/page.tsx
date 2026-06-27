import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { postsByCategory } from "@/lib/blog";
import { allCategories, getCategory } from "@/lib/blog-categories";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, blogCollectionJsonLd } from "@/components/seo/json-ld";
import { BlogCard } from "@/components/blog/blog-card";
import { CategoryChips } from "@/components/blog/category-chips";
import { BlogNewsletterBand } from "@/components/blog/blog-newsletter-band";
import { SponsoredSlot } from "@/components/sponsored-slot";
import { isUnoptimizedImageSrc } from "@/lib/img";

export function generateStaticParams() {
  return allCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return pageMeta({ title: "Blog", path: `/blog/category/${slug}`, index: false });
  return pageMeta({
    title: cat.title,
    description: cat.description,
    path: `/blog/category/${cat.slug}`,
    image: cat.heroImage,
    absoluteTitle: true,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();
  const posts = postsByCategory(cat.slug);

  return (
    <>
      <JsonLd
        data={[
          blogCollectionJsonLd(cat, posts),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: cat.name, path: `/blog/category/${cat.slug}` },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/blog">Blog</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{cat.name}</span>
            </nav>
            <div className="blog-cat-hero">
              <div className="blog-cat-hero-text">
                <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 640 }}>{cat.name}</h1>
                <p className="muted" style={{ maxWidth: 600, marginTop: 10, fontSize: "1.05rem" }}>{cat.description}</p>
              </div>
              <div className="blog-cat-hero-media">
                <Image src={cat.heroImage} alt={cat.heroAlt} fill sizes="(max-width:760px) 100vw, 420px" priority unoptimized={isUnoptimizedImageSrc(cat.heroImage)} style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="blog-grid">
            {posts.map((p, i) => (
              <BlogCard key={p.slug} post={p} headingLevel="h2" priority={i === 0} />
            ))}
          </div>

          <div className="blog-inline-cta">
            <SponsoredSlot placement="blog_inline" />
          </div>

          <div className="blog-inline-cta">
            <BlogNewsletterBand source={`blog-cat:${cat.slug}`} />
          </div>

          <div className="blog-section" style={{ marginTop: 8 }}>
            <h2 className="blog-hub-heading">Other topics</h2>
            <CategoryChips activeSlug={cat.slug} />
          </div>
        </div>
      </div>
    </>
  );
}
