import { PlanBenefitsCard } from "humblehalalsg";

const noop = () => {};

// NOTE: PlanBenefitsCard fetches /api/owner/entitlements on mount and exposes no
// data prop, so it can only ever render its loading skeleton statically. Kept for
// completeness; see .design-sync/learnings/batchC.md.
export const Loading = () => (
  <div style={{ maxWidth: 560 }}>
    <PlanBenefitsCard businessId="warung-bumbu-rempah" onUpgrade={noop} />
  </div>
);
