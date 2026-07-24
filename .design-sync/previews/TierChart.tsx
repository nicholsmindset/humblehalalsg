import { TierChart } from "humblehalalsg";

// ResponsiveContainer (width/height 100%) needs an explicitly sized parent.
const tiers = [
  { tier: "Early bird", issued: 120, checkedIn: 98 },
  { tier: "Standard", issued: 240, checkedIn: 176 },
  { tier: "Family (4)", issued: 60, checkedIn: 52 },
  { tier: "At door", issued: 45, checkedIn: 45 },
];

export const TicketTiers = () => (
  <div style={{ width: 460, height: 240 }}>
    <TierChart tiers={tiers} />
  </div>
);
