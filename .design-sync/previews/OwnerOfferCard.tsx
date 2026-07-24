import { OwnerOfferCard } from "humblehalalsg";

const noop = () => {};
const toast = (_m: string) => {};

export const LockedOnFree = () => (
  <div style={{ maxWidth: 560 }}>
    <OwnerOfferCard plan="free" toast={toast} onUpgrade={noop} />
  </div>
);

export const PremiumEditor = () => (
  <div style={{ maxWidth: 560 }}>
    <OwnerOfferCard plan="premium" toast={toast} onUpgrade={noop} />
  </div>
);
