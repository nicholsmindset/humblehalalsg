import { EventBadges } from "humblehalalsg";

const wrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  padding: 18,
  maxWidth: 420,
  background: "var(--cream)",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--line)",
};

export const FullSisters = () => (
  <div style={wrap}>
    <EventBadges ev={{ halalCatering: true, prayerNearby: true, genderArrangement: "sisters" }} />
  </div>
);

export const HalalAndPrayer = () => (
  <div style={wrap}>
    <EventBadges ev={{ halalCatering: true, prayerNearby: true, genderArrangement: "mixed" }} />
  </div>
);

export const BrothersCompact = () => (
  <div style={wrap}>
    <EventBadges ev={{ halalCatering: false, prayerNearby: true, genderArrangement: "brothers" }} compact />
  </div>
);
