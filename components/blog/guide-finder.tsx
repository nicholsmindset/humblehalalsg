"use client";

import { Fragment, useState, type ReactNode } from "react";
import { BlogCard } from "./blog-card";
import { EditorialAd } from "@/components/ads/editorial-ad";
import { listingAdBreaks } from "@/lib/editorial-ads";
import { filterGuides, type GuideCard } from "@/lib/blog-discovery";

export function GuideFinder({ posts, featuredSlug, featured, categories }: {
  posts: GuideCard[]; featuredSlug: string; featured: ReactNode; categories: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const results = searching ? filterGuides(posts, query) : posts.filter(p => p.slug !== featuredSlug);
  // Search results stay focused on discovery. The editorial index retains its
  // existing ad positions; do not recreate/refresh ads on every keystroke.
  const adBreaks = searching ? [] : listingAdBreaks(results.length);
  return <>
    <section className="guide-finder" id="find-guides" aria-label="Find a guide">
      <label htmlFor="guide-query">What would you like to explore?</label>
      <div className="guide-search-field">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
        <input id="guide-query" type="search" placeholder="Try pho, buffets or halal basics" value={query} onChange={e => setQuery(e.target.value)} />
        {query && <button type="button" onClick={() => setQuery("")}>Clear</button>}
      </div>
    </section>
    {!searching && featured}
    {!searching && <div className="guide-topics"><h2 className="blog-hub-heading">Browse by topic</h2>{categories}</div>}
    <section className="guide-results" aria-labelledby="guide-results-title">
      <div className="guide-results-head">
        <h2 id="guide-results-title">{searching ? "Search results" : "Latest guides"}</h2>
        <p role="status" aria-live="polite">{results.length} {results.length === 1 ? "guide" : "guides"}{searching ? ` for “${query.trim()}”` : " to explore"}</p>
      </div>
      {results.length ? <div className="blog-grid">
        {results.map((post, i) => <Fragment key={post.slug}>
          <BlogCard post={post} headingLevel="h3" />
          {adBreaks.includes(i) && <EditorialAd placement={`blog-after-${i + 1}`} />}
        </Fragment>)}
      </div> : <div className="guide-empty">
        <h3>No guides found</h3><p>Try a cuisine, neighbourhood or a broader term such as “halal”.</p>
        <button type="button" className="btn btn-primary" onClick={() => setQuery("")}>Show all guides</button>
      </div>}
    </section>
  </>;
}
