import type { QA } from "@/lib/faq";

export function Faq({
  items,
  title = "Frequently asked questions",
  eyebrow = "Good to know",
  columns = 1,
}: {
  items: QA[];
  title?: string;
  eyebrow?: string;
  /** 2 renders a responsive two-column grid (one column on mobile) for long lists. */
  columns?: 1 | 2;
}) {
  const twoCol = columns === 2;
  return (
    <section className={`hh-wrap hh-section faq-section${twoCol ? " cols-2" : ""}`} aria-labelledby="faq-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id="faq-heading" style={{ fontSize: "1.6rem", marginTop: 6, marginBottom: 18 }}>
        {title}
      </h2>
      <div className={`faq-list${twoCol ? " cols-2" : ""}`}>
        {items.map((it, i) => (
          <details key={i} className="faq-item" name="faq">
            <summary>
              {it.q}
              <span className="faq-chevron" aria-hidden="true" />
            </summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
