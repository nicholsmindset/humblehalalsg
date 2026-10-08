/* Category hub — a row of chips linking to each blog category, with a post
   count badge. Reused on the blog index and as cross-links on category pages.
   Server component. */
import Link from "next/link";
import { allCategories, type BlogCategorySlug } from "@/lib/blog-categories";
import { allBlogPosts } from "@/lib/cms-blog";

export async function CategoryChips({ activeSlug }: { activeSlug?: BlogCategorySlug }) {
  const posts = await allBlogPosts();
  return (
    <nav className="blog-cat-hub" aria-label="Blog categories">
      <Link href="/blog" className={`blog-cat-chip${!activeSlug ? " is-active" : ""}`} aria-current={!activeSlug ? "page" : undefined}>All guides<span className="blog-cat-chip-count">{posts.length}</span></Link>
      {allCategories().map((c) => {
        const count = posts.filter(post => post.category === c.slug).length;
        if (count === 0) return null;
        const active = c.slug === activeSlug;
        return (
          <Link
            key={c.slug}
            href={`/blog/category/${c.slug}`}
            className={`blog-cat-chip${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {c.name}
            <span className="blog-cat-chip-count">{count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
