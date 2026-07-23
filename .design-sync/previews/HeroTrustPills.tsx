import { HeroTrustPills } from "humblehalalsg";

// The pills are white/translucent by design — they sit on the travel hero's
// deep-emerald banner, so the preview provides that intended dark ground.
export const OnHero = () => (
  <div
    style={{
      maxWidth: 720,
      padding: "28px 24px",
      borderRadius: "var(--r-lg)",
      background: "linear-gradient(135deg, var(--emerald), var(--emerald-700))",
    }}
  >
    <HeroTrustPills />
  </div>
);
