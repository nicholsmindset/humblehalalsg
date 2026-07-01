/* Author bio + trust block for the end of an article. Server component. */
export function AuthorBio({ name }: { name: string }) {
  return (
    <div className="author-bio">
      <span className="mono" aria-hidden="true">HH</span>
      <div>
        <div className="role">Independently researched · MUIS-aware</div>
        <h4>{name}</h4>
        <p>
          We map Singapore&rsquo;s halal &amp; Muslim-owned scene and explain it plainly — so you can
          eat with confidence. The MUIS HalalSG register is always the final word.
        </p>
        <span className="verified">✓ Verified by Humble Halal</span>
      </div>
    </div>
  );
}
