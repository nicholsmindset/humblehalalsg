/* Blog authors — powers the BlogPosting `author` schema node (Person/Organization
   for E-E-A-T) and the end-of-article AuthorBio. Authors are managed in the CMS
   (Keystatic `authors` collection, content/authors/*) and resolved over this
   static default. A post links an author via `authorId` (or its legacy `author`
   string name); unmatched authors fall back to the team Organization. Do NOT
   invent real people or credentials — seed only owner-provided authors. */

export interface BlogAuthor {
  /** slug id (matches the Keystatic entry filename / a post's authorId). */
  id: string;
  name: string;
  /** Person for a named human editor (E-E-A-T), Organization for the team. */
  type: "Person" | "Organization";
  role?: string;
  bio?: string;
  avatar?: string;
  /** Author/profile page. */
  url?: string;
  /** Social / professional links (schema.org sameAs). */
  sameAs?: string[];
}

export const DEFAULT_AUTHOR: BlogAuthor = {
  id: "the-humble-halal-team",
  name: "The Humble Halal Team",
  type: "Organization",
  role: "Editorial team",
  bio: "The editorial team at Humble Halal — Singapore's halal & Muslim-owned business directory. We map the scene and explain it plainly; the MUIS HalalSG register is always the final word.",
  url: "https://www.humblehalal.com/about",
};

export function authorSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Resolve a post's author (by authorId or legacy name) against the CMS authors,
    falling back to the team Organization so every post always has an author. */
export function resolveAuthor(nameOrId: string | undefined, cmsAuthors: BlogAuthor[]): BlogAuthor {
  if (!nameOrId) return DEFAULT_AUTHOR;
  const key = authorSlug(nameOrId);
  const hit = cmsAuthors.find((a) => a.id === key || authorSlug(a.name) === key);
  return hit || DEFAULT_AUTHOR;
}
