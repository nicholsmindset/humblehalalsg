import { Newsletter } from "humblehalalsg";

export const Inline = () => (
  <div style={{ maxWidth: 420 }}>
    <Newsletter source="footer" cta="Get halal food deals" />
  </div>
);

export const Card = () => (
  <div style={{ maxWidth: 420 }}>
    <Newsletter
      source="hero"
      variant="card"
      collectName
      cta="Send me the deals"
    />
  </div>
);

export const NoConsentLine = () => (
  <div style={{ maxWidth: 420 }}>
    <Newsletter source="popup" cta="Join the list" consent={false} />
  </div>
);
