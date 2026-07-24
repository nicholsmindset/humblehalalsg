import { HalalChip } from "humblehalalsg";

const box = { padding: 18 } as const;

const verifiedHotel = {
  id: "kl-anjung",
  name: "Anjung Suites Kuala Lumpur",
  flags: {
    has_prayer_room: true,
    halal_food_onsite: true,
    halal_food_nearby: true,
    alcohol_free: true,
    women_only_facilities: false,
    qibla_direction: true,
    prayer_mat_available: true,
    near_mosque: true,
  },
  halalScore: 92,
  verified: true,
  verifiedBy: "ustaz" as const,
};

const autoHotel = {
  id: "bdg-ramah",
  name: "Grha Ramah Muslim Bandung",
  flags: {
    has_prayer_room: true,
    halal_food_onsite: false,
    halal_food_nearby: true,
    alcohol_free: true,
    women_only_facilities: false,
    qibla_direction: true,
    prayer_mat_available: false,
    near_mosque: true,
  },
  halalScore: 71,
  verified: false,
  verifiedBy: "auto" as const,
};

export const Verified = () => (
  <div style={box}>
    <HalalChip hotel={verifiedHotel} />
  </div>
);

export const VerifiedCompact = () => (
  <div style={box}>
    <HalalChip hotel={verifiedHotel} compact />
  </div>
);

export const Unverified = () => (
  <div style={box}>
    <HalalChip hotel={autoHotel} />
  </div>
);
