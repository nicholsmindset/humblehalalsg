import { StatusExplainer } from "humblehalalsg";

export const Certified = () => (
  <div style={{ maxWidth: 660 }}>
    <StatusExplainer status="certified" />
  </div>
);

export const NoPorkWithBrandLead = () => (
  <div style={{ maxWidth: 660 }}>
    <StatusExplainer
      status="no-pork"
      explainer="KOI Thé states its ingredients are plant- or dairy-based with no alcohol or animal gelatine, but that is self-declared — KOI holds no MUIS certification in Singapore, so we list it as no-pork, not certified."
    />
  </div>
);

export const NotCertified = () => (
  <div style={{ maxWidth: 660 }}>
    <StatusExplainer status="not-certified" />
  </div>
);
