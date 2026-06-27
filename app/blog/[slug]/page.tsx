import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { allPosts, getPost, relatedPosts, postWordCount } from "@/lib/blog";
import { getCategory } from "@/lib/blog-categories";
import { pageMeta } from "@/lib/seo";
import { JsonLd, blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogNewsletterBand } from "@/components/blog/blog-newsletter-band";
import { SponsoredSlot } from "@/components/sponsored-slot";

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return pageMeta({ title: "Blog", path: `/blog/${slug}` });
  return pageMeta({
    title: p.title,
    description: p.dek.length > 155 ? p.dek.slice(0, 152) + "…" : p.dek,
    path: `/blog/${p.slug}`,
    image: p.image,
  });
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${d} ${months[m - 1]} ${y}`;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();
  const related = relatedPosts(p, 3);
  const cat = getCategory(p.category);
  const n = p.sections.length;
  const midIndex = n >= 4 ? Math.floor(n / 2) - 1 : -1; // newsletter after this section
  const adIndex = n >= 3 ? n - 2 : -1; // sponsored slot before the final section

  return (
    <>
      <JsonLd
        data={[
          blogPostingJsonLd({
            headline: p.title,
            description: p.dek,
            path: `/blog/${p.slug}`,
            datePublished: p.datePublished,
            dateModified: p.dateModified,
            author: p.author,
            wordCount: postWordCount(p),
            section: cat?.name || p.tags[0],
            image: p.image,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            ...(cat ? [{ name: cat.name, path: `/blog/category/${cat.slug}` }] : []),
            { name: p.title, path: `/blog/${p.slug}` },
          ]),
          faqJsonLd(p.faq),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap" style={{ maxWidth: 800 }}>
            <nav className="flex g6 center faint wrap" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/blog">Blog</Link><span>›</span>
              {cat && (<><Link className="link-inline" href={`/blog/category/${cat.slug}`}>{cat.name}</Link><span>›</span></>)}
              <span style={{ color: "var(--ink)" }}>{p.title}</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4.2vw,2.7rem)", maxWidth: 760 }}>{p.title}</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>{p.dek}</p>
            <div className="blog-byline">By {p.author} · {fmtDate(p.datePublished)} · {p.readMins} min read</div>
          </div>
        </section>

        {/* Feature image */}
        <div className="hh-wrap" style={{ maxWidth: 800 }}>
          <figure className="blog-hero-img">
            <Image
              src={p.image}
              alt={p.imageAlt}
              fill
              sizes="(max-width:800px) 100vw, 800px"
              priority
              style={{ objectFit: "cover" }}
            />
            {p.imageCredit && <figcaption className="blog-hero-credit">{p.imageCredit}</figcaption>}
          </figure>
        </div>

        <article className="hh-wrap hh-section blog-article">
          {/* Answer-first TL;DR — the AI-Overview / featured-snippet unit */}
          <div className="blog-tldr">
            <span className="blog-tldr-label">In short</span>
            <p>{p.answer}</p>
          </div>

          {p.sections.map((s, i) => (
            <Fragment key={s.h2}>
              <section className="blog-section">
                <h2>{s.h2}</h2>
                {s.body?.map((para, j) => (
                  <p key={j}>{para}</p>
                ))}
                {s.bullets && (
                  <ul className="blog-bullets">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>

              {i === midIndex && (
                <div className="blog-inline-cta blog-nl-inline">
                  <strong>Enjoying this guide?</strong>
                  <p className="muted" style={{ margin: "4px 0 10px" }}>
                    Get weekly MUIS-verified halal finds across Singapore by email.
                  </p>
                  <Newsletter source="blog-mid" variant="inline" cta="Get weekly finds" />
                </div>
              )}

              {i === adIndex && (
                <div className="blog-inline-cta">
                  <SponsoredSlot placement="blog_inline" />
                </div>
              )}
            </Fragment>
          ))}

          <section className="blog-section">
            <h2>Frequently asked questions</h2>
            <div className="faq-list">
              {p.faq.map((f) => (
                <details key={f.q} className="faq-item">
                  <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                  <p className="muted" style={{ padding: "0 2px 4px", lineHeight: 1.6 }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="blog-cta">
            <strong>Find halal places near you</strong>
            <p className="muted" style={{ margin: "6px 0 12px" }}>Browse Singapore’s halal & Muslim-owned directory by category, area or map.</p>
            <div className="flex g10 wrap">
              <Link className="btn btn-primary btn-sm" href="/halal">Browse the halal directory</Link>
              <Link className="btn btn-outline btn-sm" href="/is-halal">Is it halal? brand checker</Link>
            </div>
          </div>

          <BlogNewsletterBand source="blog" />

          {related.length > 0 && (
            <section className="blog-section">
              <h2>Keep reading</h2>
              <div className="blog-grid">
                {related.map((r) => (
                  <BlogCard key={r.slug} post={r} headingLevel="h3" />
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
