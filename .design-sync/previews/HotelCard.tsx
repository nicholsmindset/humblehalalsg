import { HotelCard } from "humblehalalsg";

const verified = {
  id: "kl-anjung",
  name: "Anjung Suites Kuala Lumpur",
  image: "",
  city: "Kuala Lumpur",
  country: "MY",
  stars: 4,
  guestRating: 8.9,
  reviewCount: 1284,
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
  priceFrom: { amount: 78, currency: "SGD" },
};

const provisional = {
  id: "bdg-ramah",
  name: "Grha Ramah Muslim Bandung",
  image: "",
  city: "Bandung",
  country: "ID",
  stars: 3,
  guestRating: 8.2,
  reviewCount: 436,
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
  priceFrom: { amount: 42, currency: "SGD" },
};

const budget = {
  id: "jb-permai",
  name: "Teratak Permai Inn Johor Bahru",
  image: "",
  city: "Johor Bahru",
  country: "MY",
  stars: 2,
  guestRating: 7.4,
  reviewCount: 128,
  flags: {
    has_prayer_room: false,
    halal_food_onsite: false,
    halal_food_nearby: true,
    alcohol_free: true,
    women_only_facilities: true,
    qibla_direction: false,
    prayer_mat_available: true,
    near_mosque: true,
  },
  halalScore: 58,
  verified: false,
  verifiedBy: "auto" as const,
  priceFrom: { amount: 31, currency: "SGD" },
};

export const Verified = () => (
  <div style={{ maxWidth: 320 }}>
    <HotelCard hotel={verified} />
  </div>
);

export const Provisional = () => (
  <div style={{ maxWidth: 320 }}>
    <HotelCard hotel={provisional} />
  </div>
);

export const BudgetStay = () => (
  <div style={{ maxWidth: 320 }}>
    <HotelCard hotel={budget} />
  </div>
);
