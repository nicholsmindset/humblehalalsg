import { PullQuote } from "humblehalalsg";

const col = { maxWidth: 620, padding: "48px 28px" } as const;
const para = {
  fontFamily: "var(--read)",
  fontSize: "1.02rem",
  color: "var(--ink-soft)",
  lineHeight: 1.7,
  margin: 0,
} as const;

export const Attributed = () => (
  <div style={col}>
    <PullQuote
      text="No pork, no lard is a helpful signal — but it is self-declared, and it is not the same as MUIS certification."
      by="The Humble Halal Team"
    />
  </div>
);

export const NoAttribution = () => (
  <div style={col}>
    <PullQuote text="A hotel’s name means nothing on its own — MUIS certification is outlet-specific, so always check the exact restaurant." />
  </div>
);

export const InArticle = () => (
  <div style={{ maxWidth: 620, padding: "24px 28px" }}>
    <p style={para}>
      Singapore’s halal dining scene is genuinely broad — from Nasi Padang
      heritage kitchens to certified hotel buffets — yet trust still starts with
      the certificate on the wall.
    </p>
    <PullQuote
      text="Best is part taste, part trust — start with certification, then let the food decide."
      by="Best Halal Restaurants, 2026"
    />
    <p style={para}>
      From there, sort by the halal-confidence score to surface the top-rated,
      certified spots near you.
    </p>
  </div>
);
