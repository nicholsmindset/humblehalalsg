import Link from "next/link";
import { Icon } from "@/components/ui";
import type { BrandAlternative } from "@/lib/halal-status";

/* Depth sections: "What to check" list + halal-certified alternatives. */

export function WatchFor({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="hcx-h2">What to check before you order</h2>
      <ul className="hcx-watch">
        {items.map((t) => (
          <li key={t}>
            <Icon name="info" size={16} /> <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Alternatives({ items }: { items: BrandAlternative[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="hcx-h2">Halal-certified alternatives</h2>
      <div className="hcx-alts">
        {items.map((a) =>
          a.slug ? (
            <Link key={a.label} href={`/is-halal/${a.slug}`} className="hcx-alt-card">
              <Icon name="badge-check" size={16} />
              <span>
                {a.label}
                {a.note && <em>{a.note}</em>}
              </span>
              <Icon name="arrow" size={14} className="hcx-sim-arrow" />
            </Link>
          ) : (
            <div key={a.label} className="hcx-alt-card hcx-alt-static">
              <Icon name="badge-check" size={16} />
              <span>
                {a.label}
                {a.note && <em>{a.note}</em>}
              </span>
            </div>
          ),
        )}
      </div>
      <p className="faint" style={{ fontSize: ".8rem", marginTop: 8 }}>
        Alternatives listed here are MUIS halal-certified — always confirm the specific outlet on the HalalSG register.
      </p>
    </section>
  );
}
