import type { QA } from "@/lib/faq";

export function Faq({
  items,
  title = "Frequently asked questions",
  eyebrow = "Good to know",
}: {
  items: QA[];
  title?: string;
  eyebrow?: string;
}) {
  return (
    <section className="hh-wrap hh-section faq-section" aria-labelledby="faq-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id="faq-heading" style={{ fontSize: "1.6rem", marginTop: 6, marginBottom: 18 }}>
        {title}
      </h2>
      <div className="faq-list">
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
