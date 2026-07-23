import { SectionDivider } from "humblehalalsg";

const para = {
  fontFamily: "var(--read)",
  fontSize: "1.02rem",
  color: "var(--ink-soft)",
  lineHeight: 1.7,
  margin: 0,
} as const;

export const Default = () => (
  <div style={{ maxWidth: 620, padding: "16px 28px" }}>
    <SectionDivider />
  </div>
);

export const BetweenSections = () => (
  <div style={{ maxWidth: 620, padding: "8px 28px" }}>
    <p style={para}>
      MUIS certification covers the whole kitchen — ingredients, suppliers,
      storage and preparation — not just the absence of pork.
    </p>
    <SectionDivider />
    <p style={para}>
      The fastest way to verify a specific outlet is the official MUIS HalalSG
      register at halal.muis.gov.sg.
    </p>
  </div>
);
