import { MethodPanel } from "humblehalalsg";

export const Certified = () => (
  <div style={{ maxWidth: 400 }}>
    <MethodPanel status="certified" lastChecked="July 2026" />
  </div>
);

export const NotCertified = () => (
  <div style={{ maxWidth: 400 }}>
    <MethodPanel status="not-certified" lastChecked="July 2026" />
  </div>
);

export const NoPork = () => (
  <div style={{ maxWidth: 400 }}>
    <MethodPanel status="no-pork" lastChecked="July 2026" />
  </div>
);
