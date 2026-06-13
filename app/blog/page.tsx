import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/blog";
import { SITE, pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMeta({
  title: "Halal Guides & Stories — Humble Halal Blog",
  description:
    "Guides to eating halal in Singapore — what halal means, how MUIS certification works, the best halal restaurants and buffets, and more from the Humble Halal team.",
  path: "/blog",
});

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export default function Page() {
  const posts = allPosts();

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Humble Halal Blog",
    url: `${SITE.url}/blog`,
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE.url}/blog/${p.slug}`,
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
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Halal guides & stories</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              Practical guides to eating halal in Singapore — what halal means, how MUIS certification works, and where to find the best halal food.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="blog-grid">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
                <span className="blog-card-tag">{p.tags[0]}</span>
                <h2 className="blog-card-title">{p.title}</h2>
                <p className="blog-card-dek">{p.dek}</p>
                <span className="blog-card-meta">{fmtDate(p.datePublished)} · {p.readMins} min read</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
