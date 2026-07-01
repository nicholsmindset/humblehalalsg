/* Editorial pull-quote — Spectral italic, emerald rule + gold quote glyph. Server. */
export function PullQuote({ text, by }: { text: string; by?: string }) {
  return (
    <figure className="article-pq">
      <span className="glyph" aria-hidden="true">&ldquo;</span>
      <p>{text}</p>
      {by && <cite>{by}</cite>}
    </figure>
  );
}
