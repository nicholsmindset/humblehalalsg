import { StatCard } from "humblehalalsg";

export const Default = () => (
  <div style={{ maxWidth: 280 }}>
    <StatCard label="Total listings" value="1,284" icon="store" />
  </div>
);

export const PositiveDelta = () => (
  <div style={{ maxWidth: 280 }}>
    <StatCard label="Monthly page views" value="48.2k" delta={12.4} icon="eye" />
  </div>
);

export const NegativeDelta = () => (
  <div style={{ maxWidth: 280 }}>
    <StatCard label="Bounce rate" value="34%" delta={-5.1} deltaLabel="vs last month" icon="trend" />
  </div>
);

export const WithHint = () => (
  <div style={{ maxWidth: 280 }}>
    <StatCard label="Rewards balance" value="S$ 8,410" hint="Gross before platform fees" icon="dollar" />
  </div>
);
