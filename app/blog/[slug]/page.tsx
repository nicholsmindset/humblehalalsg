import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { allPosts, getPost, relatedPosts, postWordCount } from "@/lib/blog";
import { getCategory } from "@/lib/blog-categories";
import { SITE, pageMeta } from "@/lib/seo";
import { JsonLd, blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogNewsletterBand } from "@/components/blog/blog-newsletter-band";
import { SponsoredSlot } from "@/components/sponsored-slot";
import { AdSlot } from "@/components/ads/ad-slot";
import { PullQuote } from "@/components/blog/pull-quote";
import { ArticleFigure } from "@/components/blog/article-figure";
import { AuthorBio } from "@/components/blog/author-bio";
import { SectionDivider } from "@/components/blog/section-divider";
import { ShareRow } from "@/components/blog/share-row";
import { isUnoptimizedImageSrc } from "@/lib/img";
import { LeadInline } from "@/components/lead-capture/lead-inline";
import { LeadCapturePopup } from "@/components/lead-capture/lead-capture-popup";
import { leadInlineIndex } from "@/lib/lead-placement";

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
  // Unknown slug → noindex (matches the category route); the page body 404s.
  if (!p) return pageMeta({ title: "Blog", path: `/blog/${slug}`, index: false });
  return pageMeta({
    title: p.title,
    description: p.dek.length > 155 ? p.dek.slice(0, 152) + "…" : p.dek,
    path: `/blog/${p.slug}`,
    image: p.image,
    article: {
      publishedTime: p.datePublished,
      modifiedTime: p.dateModified,
      section: getCategory(p.category)?.title,
    },
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
  const pqIndex = p.pullQuote ? Math.min(1, n - 1) : -1; // pull-quote after this section
  // Subtle lead-capture teaser (vertical-tagged posts only): placement helper
  // guarantees ≥2 sections from the newsletter ribbon or omits entirely; the
  // component itself is flag-gated client-side (renders nothing when off).
  const leadIndex = p.leadVertical ? leadInlineIndex(n, midIndex, adIndex) : -1;

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
      <div className="read-progress" aria-hidden="true" />
      <div className="screen-in hh-page article-page">
        {/* Masthead */}
        <header className="article-head">
          <nav className="article-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span className="sep">›</span>
            <Link href="/blog">Blog</Link>
            {cat && (<><span className="sep">›</span><Link href={`/blog/category/${cat.slug}`}>{cat.name}</Link></>)}
          </nav>
          <div className="article-kicker">{cat?.name || p.tags[0]}</div>
          <h1 className="article-title">{p.title}</h1>
          <p className="article-dek">{p.dek}</p>
          <div className="article-byline">
            <span className="mono" aria-hidden="true">HH</span>
            By {p.author}
            <span className="sep">·</span> {fmtDate(p.datePublished)}
            <span className="sep">·</span> {p.readMins} min read
            {p.dateModified && (<><span className="sep">·</span> Updated {fmtDate(p.dateModified)}</>)}
          </div>
        </header>

        {/* Hero image */}
        <div className="article-hero">
          <figure>
            <Image
              src={p.image}
              alt={p.imageAlt}
              fill
              sizes="(max-width:1120px) 100vw, 1080px"
              priority
              unoptimized={isUnoptimizedImageSrc(p.image)}
              style={{ objectFit: "cover" }}
            />
          </figure>
          {p.imageCredit && <figcaption>{p.imageCredit}</figcaption>}
        </div>

        {/* Reading column */}
        <article className="article-col">
          <div className="standfirst">
            <span className="standfirst-lbl">In short</span>
            <p>{p.answer}</p>
          </div>

          {/* Top-of-article slot (leaderboard) — AdSense fill, below the TL;DR so it
              never sits between the reader and the answer. */}
          <AdSlot slot="blog_article_top" />

          <div className="article-body">
            {p.sections.map((s, i) => (
              <Fragment key={s.h2}>
                <section>
                  <h2>{s.h2}</h2>
                  {s.body?.map((para, j) => (
                    <p key={j} className={i === 0 && j === 0 && p.dropcap ? "has-dropcap" : undefined}>{para}</p>
                  ))}
                  {s.bullets && (
                    <ul className="article-checks">
                      {s.bullets.map((b) => (<li key={b}>{b}</li>))}
                    </ul>
                  )}
                </section>

                {s.image && <ArticleFigure src={s.image} alt={s.imageAlt || s.h2} caption={s.caption} />}

                {i === pqIndex && p.pullQuote && <PullQuote text={p.pullQuote} by={p.pullQuoteBy} />}

                {i === leadIndex && p.leadVertical && (
                  <LeadInline vertical={p.leadVertical} surface="blog" />
                )}
                {i === 0 && p.leadVertical && <LeadCapturePopup vertical={p.leadVertical} />}

                {i === midIndex && (
                  <div className="article-ribbon">
                    <span className="eyebrow">🌙 The weekly halal guide</span>
                    <strong>Enjoying this guide?</strong>
                    <p>New MUIS-verified spots, mosque events &amp; deals across Singapore — free, every week.</p>
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
          </div>

          <SectionDivider />

          <h3 className="article-faq-h">Frequently asked questions</h3>
          <div className="faq-list">
            {p.faq.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                <p className="muted" style={{ padding: "0 2px 4px", lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>

          <AuthorBio name={p.author} />

          <div className="article-cta">
            <strong>Find halal places near you</strong>
            <p>Browse Singapore’s halal &amp; Muslim-owned directory by category, area or map.</p>
            <div className="flex g10 wrap">
              <Link className="btn btn-primary btn-sm" href="/halal">Browse the halal directory</Link>
              <Link className="btn btn-outline btn-sm" href="/is-halal">Is it halal? brand checker</Link>
            </div>
          </div>

          <BlogNewsletterBand source="blog" />

          <ShareRow url={`${SITE.url}/blog/${p.slug}`} title={p.title} />

          {related.length > 0 && (
            <>
              <h3 className="article-related-h">Keep reading</h3>
              <div className="blog-grid">
                {related.map((r) => (
                  <BlogCard key={r.slug} post={r} headingLevel="h3" />
                ))}
              </div>
            </>
          )}
        </article>
      </div>
    </>
  );
}
