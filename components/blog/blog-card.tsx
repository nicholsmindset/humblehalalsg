/* Reusable blog card with a feature image. Used on the blog index, category
   pages, and the related-posts rail. Server component — pure markup. */
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog";
import { getCategory } from "@/lib/blog-categories";

type CardPost = Pick<
  BlogPost,
  "slug" | "title" | "dek" | "readMins" | "datePublished" | "image" | "imageAlt" | "category" | "tags"
>;

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function BlogCard({
  post,
  headingLevel = "h3",
  priority = false,
}: {
  post: CardPost;
  /** Use h2 on the index (SEO heading order); h3 inside grids/rails. */
  headingLevel?: "h2" | "h3";
  priority?: boolean;
}) {
  const Heading = headingLevel;
  const cat = getCategory(post.category);
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card-media">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            sizes="(max-width:560px) 100vw, (max-width:860px) 50vw, 360px"
            priority={priority}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="blog-card-media-ph" aria-hidden="true" />
        )}
      </div>
      <div className="blog-card-body">
        <span className="blog-card-tag">{cat?.name || post.tags[0]}</span>
        <Heading className="blog-card-title">{post.title}</Heading>
        <p className="blog-card-dek">{post.dek}</p>
        <span className="blog-card-meta">
          {fmtDate(post.datePublished)} · {post.readMins} min read
        </span>
      </div>
    </Link>
  );
}
