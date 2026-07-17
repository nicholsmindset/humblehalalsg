import type { HalalStatus } from "@/lib/halal-status";
import { STATUS_EXPLAINERS } from "@/lib/halal-status-content";

/* "What '<status>' means" — educational panel; per-brand `explainer`
   (from curated content or CMS) becomes the lead paragraph when present. */
export function StatusExplainer({ status, explainer }: { status: HalalStatus; explainer?: string }) {
  const e = STATUS_EXPLAINERS[status];
  return (
    <section className="hcx-explainer">
      <h2 className="hcx-h2">{e.title}</h2>
      {explainer && <p>{explainer}</p>}
      {e.body.map((p) => (
        <p key={p.slice(0, 40)}>{p}</p>
      ))}
    </section>
  );
}
