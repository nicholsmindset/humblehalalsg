import { BusinessMediaFallback } from "humblehalalsg";

const frame = {
  position: "relative" as const,
  width: 320,
  height: 190,
  borderRadius: 16,
  overflow: "hidden" as const,
};

export const Full = () => (
  <div style={frame}>
    <BusinessMediaFallback name="Warung Bumbu Rempah" category="Nasi Padang" area="Tampines" />
  </div>
);

export const Cafe = () => (
  <div style={frame}>
    <BusinessMediaFallback name="Qahwa & Co." category="Specialty Coffee" area="Bugis" />
  </div>
);

export const Compact = () => (
  <div style={{ position: "relative", width: 108, height: 120, borderRadius: 12, overflow: "hidden" }}>
    <BusinessMediaFallback name="Tok Tok Mee Pok House" category="Noodles" area="Bedok" compact />
  </div>
);
