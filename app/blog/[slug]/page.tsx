import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPosts, getPost, relatedPosts, postWordCount } from "@/lib/blog";
import { pageMeta } from "@/lib/seo";
import { JsonLd, blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

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
            section: p.tags[0],
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: p.title, path: `/blog/${p.slug}` },
          ]),
          faqJsonLd(p.faq),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap" style={{ maxWidth: 800 }}>
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/blog">Blog</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{p.tags[0]}</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4.2vw,2.7rem)", maxWidth: 760 }}>{p.title}</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>{p.dek}</p>
            <div className="blog-byline">By {p.author} · {fmtDate(p.datePublished)} · {p.readMins} min read</div>
          </div>
        </section>

        <article className="hh-wrap hh-section blog-article">
          {/* Answer-first TL;DR — the AI-Overview / featured-snippet unit */}
          <div className="blog-tldr">
            <span className="blog-tldr-label">In short</span>
            <p>{p.answer}</p>
          </div>

          {p.sections.map((s) => (
            <section key={s.h2} className="blog-section">
              <h2>{s.h2}</h2>
              {s.body?.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {s.bullets && (
                <ul className="blog-bullets">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
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

          {related.length > 0 && (
            <section className="blog-section">
              <h2>Keep reading</h2>
              <div className="blog-grid">
                {related.map((r) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="blog-card">
                    <span className="blog-card-tag">{r.tags[0]}</span>
                    <h3 className="blog-card-title">{r.title}</h3>
                    <span className="blog-card-meta">{r.readMins} min read</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  );
}
