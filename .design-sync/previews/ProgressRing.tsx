import { ProgressRing } from "humblehalalsg";

export const ProfileStrength = () => (
  <ProgressRing value={0.82} tone="emerald" label="Listing profile strength">
    <strong style={{ fontSize: 22 }}>82%</strong>
    <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>Complete</span>
  </ProgressRing>
);

export const EventCapacity = () => (
  <ProgressRing value={0.35} tone="gold" stroke={16} size={104} label="Seats filled">
    <strong style={{ fontSize: 20 }}>35%</strong>
    <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>23 / 64 seats</span>
  </ProgressRing>
);

export const CertRenewal = () => (
  <ProgressRing value={0.15} tone="danger" label="Days to certificate renewal">
    <strong style={{ fontSize: 20 }}>18d</strong>
    <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>to renewal</span>
  </ProgressRing>
);
