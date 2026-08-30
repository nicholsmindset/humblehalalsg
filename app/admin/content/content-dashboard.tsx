"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EditorialPost, EditorialStage } from "@/lib/cms-editorial";
import styles from "./content-dashboard.module.css";

type Filter = "all" | EditorialStage;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All posts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Posted" },
  { key: "draft", label: "Drafts" },
];

const STAGE_LABEL: Record<EditorialStage, string> = {
  published: "Posted",
  scheduled: "Scheduled",
  draft: "Draft",
};

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Singapore",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function sortPosts(posts: EditorialPost[]): EditorialPost[] {
  const rank: Record<EditorialStage, number> = { scheduled: 0, draft: 1, published: 2 };
  return [...posts].sort((a, b) => {
    if (rank[a.stage] !== rank[b.stage]) return rank[a.stage] - rank[b.stage];
    if (a.stage === "scheduled") return a.datePublished.localeCompare(b.datePublished);
    return b.datePublished.localeCompare(a.datePublished);
  });
}

export default function ContentDashboard({
  posts,
  today,
  cmsBasePath,
}: {
  posts: EditorialPost[];
  today: string;
  cmsBasePath: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((post) => post.stage === "published").length,
    scheduled: posts.filter((post) => post.stage === "scheduled").length,
    draft: posts.filter((post) => post.stage === "draft").length,
  }), [posts]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortPosts(posts).filter((post) => {
      if (filter !== "all" && post.stage !== filter) return false;
      if (!needle) return true;
      return `${post.title} ${post.slug} ${post.category}`.toLowerCase().includes(needle);
    });
  }, [filter, posts, query]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/keystatic">← Back to CMS</Link>
          <p className={styles.kicker}>Editorial overview</p>
          <h1>Blog publishing schedule</h1>
          <p className={styles.subtitle}>
            See what is live, what publishes next and which feature image is assigned. Dates use Singapore time.
          </p>
        </div>
        <Link className={styles.primaryAction} href={`${cmsBasePath}/collection/posts/create`}>Add blog post</Link>
      </header>

      <section className={styles.summary} aria-label="Publishing summary">
        <div><span>Total</span><strong>{counts.all}</strong></div>
        <div><span>Posted</span><strong>{counts.published}</strong></div>
        <div><span>Scheduled next</span><strong>{counts.scheduled}</strong></div>
        <div><span>Drafts</span><strong>{counts.draft}</strong></div>
      </section>

      <section className={styles.controls} aria-label="Filter blog posts">
        <div className={styles.filters}>
          {FILTERS.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              className={filter === key ? styles.filterActive : styles.filter}
              onClick={() => setFilter(key)}
            >
              {label} <span>{counts[key]}</span>
            </button>
          ))}
        </div>
        <label className={styles.search}>
          <span className="sr-only">Search blog posts</span>
          <input
            type="search"
            placeholder="Search title, slug or category"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <div className={styles.resultLine}>
        <span>{visible.length} {visible.length === 1 ? "article" : "articles"}</span>
        <span>Today: {formatDate(today)} SGT</span>
      </div>

      {visible.length ? (
        <section className={styles.grid} aria-live="polite">
          {visible.map((post, index) => {
            const internalImage = post.image.startsWith("/") ? post.image : null;
            const editHref = `${cmsBasePath}/collection/posts/item/${encodeURIComponent(post.slug)}`;
            return (
              <article className={styles.card} key={post.slug}>
                <div className={styles.imageWrap}>
                  {internalImage ? (
                    <Image
                      src={internalImage}
                      alt={post.imageAlt}
                      fill
                      sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      className={styles.image}
                      loading={index < 3 ? "eager" : "lazy"}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.imageFallback}>External feature image</div>
                  )}
                  <span className={`${styles.status} ${styles[post.stage]}`}>{STAGE_LABEL[post.stage]}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.dateRow}>
                    <span>{post.stage === "scheduled" ? "Publishes" : post.stage === "published" ? "Posted" : "Planned"}</span>
                    <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                  </div>
                  <h2>{post.title}</h2>
                  <p className={styles.slug}>/blog/{post.slug}</p>
                  <div className={styles.meta}>
                    <span>{post.category.replaceAll("-", " ")}</span>
                    <span>{post.readMins} min read</span>
                  </div>
                  {post.configuredStatus === "scheduled" && post.stage === "published" && (
                    <p className={styles.liveNote}>Published automatically when its scheduled date arrived.</p>
                  )}
                  <div className={styles.actions}>
                    <Link href={editHref}>Edit in CMS</Link>
                    {post.stage === "published" && <Link href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">View live ↗</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className={styles.empty}>No blog posts match this filter.</div>
      )}
    </main>
  );
}
