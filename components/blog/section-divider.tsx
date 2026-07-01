/* Restrained girih-diamond section divider. Server component. */
export function SectionDivider() {
  return (
    <div className="article-divider" aria-hidden="true">
      <span className="ln" />
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.2">
        <path d="M12 1l11 11-11 11L1 12z" />
        <path d="M12 6l6 6-6 6-6-6z" />
      </svg>
      <span className="ln" />
    </div>
  );
}
