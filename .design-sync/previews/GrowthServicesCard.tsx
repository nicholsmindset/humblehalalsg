import { GrowthServicesCard } from "humblehalalsg";

const noop = () => {};

export const Default = () => (
  <div style={{ maxWidth: 680 }}>
    <GrowthServicesCard onContact={noop} />
  </div>
);

export const Narrow = () => (
  <div style={{ maxWidth: 360 }}>
    <GrowthServicesCard onContact={noop} />
  </div>
);
