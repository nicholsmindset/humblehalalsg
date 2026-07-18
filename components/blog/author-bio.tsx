/* Author bio + trust block for the end of an article. Server component.
   Renders the resolved BlogAuthor (Person or team Organization) — name, role,
   bio and any professional links — with a sensible fallback for legacy callers. */
import type { BlogAuthor } from "@/lib/blog-authors";

const FALLBACK_BIO =
  "We map Singapore’s halal & Muslim-owned scene and explain it plainly — so you can eat with confidence. The MUIS HalalSG register is always the final word.";

export function AuthorBio({ author, name }: { author?: BlogAuthor; name?: string }) {
  const displayName = author?.name || name || "The Humble Halal Team";
  const role = author?.role || "Independently researched · MUIS-aware";
  const bio = author?.bio || FALLBACK_BIO;
  const links = author?.sameAs?.filter(Boolean) || [];
  return (
    <div className="author-bio">
      <span className="mono" aria-hidden="true">HH</span>
      <div>
        <div className="role">{role}</div>
        <h4>{displayName}</h4>
        <p>{bio}</p>
        {links.length > 0 && (
          <div className="author-links">
            {links.map((href) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer nofollow">
                {new URL(href).hostname.replace(/^www\./, "")}
              </a>
            ))}
          </div>
        )}
        <span className="verified">✓ Verified by Humble Halal</span>
      </div>
    </div>
  );
}
