import type { BrandFaqItem } from "@/lib/halal-status";

/* Bare FAQ accordion list — the shared <Faq> wraps itself in .hh-wrap.hh-section
   and can't sit inside a grid column; this renders just the list. */
export function BrandFaqList({ items, heading = "Frequently asked questions" }: { items: BrandFaqItem[]; heading?: string }) {
  return (
    <section>
      <h2 className="hcx-h2">{heading}</h2>
      <div className="faq-list">
        {items.map((f) => (
          <details key={f.q} className="faq-item" name="brand-faq">
            <summary>
              {f.q}
              <span className="faq-chevron" aria-hidden="true" />
            </summary>
            <p className="muted" style={{ padding: "0 2px 4px", lineHeight: 1.6 }}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
