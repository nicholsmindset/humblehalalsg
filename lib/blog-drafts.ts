import type { BlogPost } from "./blog";

/* Draft posts produced by the weekly blog-drafting job (C1). These are NOT
   rendered publicly — a human reviews the PR and moves an entry into
   lib/blog.ts to publish it. Keeping drafts separate makes "drafted by AI" vs
   "approved & published" an explicit, auditable step (golden rule). */
export const blogDrafts: BlogPost[] = [];
