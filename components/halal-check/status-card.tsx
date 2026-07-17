import { Icon } from "@/components/ui";
import { STATUS_META, type BrandHalal } from "@/lib/halal-status";
import { halalSgSearchUrl } from "@/lib/muis";

/* The mockup's verdict card: tone icon, status pill, headline, answer,
   "why this status" bullets, details table, CTAs. Server component. */

const TONE_ICON: Record<string, string> = { yes: "badge-check", warn: "info", no: "warning" };

export function StatusCard({ b }: { b: BrandHalal }) {
  const m = STATUS_META[b.status];
  return (
    <div className={`hcx-status-card hs-verdict hs-${m.tone}`}>
      <div className="hcx-status-top">
        <span className={`hcx-status-icon hcx-tone-${m.tone}`} aria-hidden="true">
          <Icon name={TONE_ICON[m.tone] || "info"} size={26} />
        </span>
        <span className={`hs-pill hs-${m.tone}`}>{m.label}</span>
      </div>
      <h2 className="hcx-headline">
        {b.brand} — {m.verdict === "Yes" ? "MUIS halal-certified" : m.verdict === "No" ? "not MUIS halal-certified" : m.label.toLowerCase()}
      </h2>
      <p className="hs-verdict-answer">{b.answer}</p>
      {b.whyStatus?.length ? (
        <ul className="hcx-why">
          {b.whyStatus.map((w) => (
            <li key={w}>
              <Icon name="check" size={15} /> <span>{w}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="hcx-table">
        <div className="row">
          <Icon name="shield-check" size={16} />
          <dt>Status</dt>
          <dd>{m.label}</dd>
        </div>
        <div className="row">
          <Icon name="tag" size={16} />
          <dt>Category</dt>
          <dd>{b.category}</dd>
        </div>
        {b.certifiedSince && (
          <div className="row">
            <Icon name="badge-check" size={16} />
            <dt>Certified since</dt>
            <dd>{b.certifiedSince}</dd>
          </div>
        )}
        <div className="row">
          <Icon name="clock" size={16} />
          <dt>Last checked</dt>
          <dd>{b.lastChecked}</dd>
        </div>
        <div className="row">
          <Icon name="doc" size={16} />
          <dt>Source</dt>
          <dd>{b.source}</dd>
        </div>
      </dl>
      <div className="hcx-ctas">
        <a className="btn btn-primary" href={halalSgSearchUrl(b.brand)} target="_blank" rel="noopener noreferrer">
          Verify on MUIS HalalSG <Icon name="external" size={15} />
        </a>
        <a className="btn btn-outline" href={`/report?reason=halal&name=${encodeURIComponent(b.brand)}`}>
          <Icon name="flag" size={15} /> Report an update
        </a>
      </div>
    </div>
  );
}
