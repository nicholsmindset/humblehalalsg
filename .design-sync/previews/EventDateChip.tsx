import { EventDateChip } from "humblehalalsg";
import type { ComponentProps } from "react";

type Ev = ComponentProps<typeof EventDateChip>["ev"];

const base: Ev = {
  id: "ev-1",
  title: "Community Iftar",
  catId: "community",
  cat: "Community",
  img: "",
  tone: "emerald",
  free: true,
  priceFrom: 0,
  dateLabel: "Sat, 14 Mar",
  timeLabel: "6:45 PM",
  dateISO: "2026-03-14",
  venue: "Masjid Sultan",
  area: "Kampong Gelam",
  capacity: 300,
  taken: 240,
  organiserId: null,
  organiser: "Masjid Sultan",
  organiserBiz: false,
  blurb: "Break fast together with the community.",
  tags: ["Halal food", "Prayer space"],
  prayerNearby: true,
  halalCatering: true,
  featured: true,
  attendees: 240,
};

const stage: React.CSSProperties = {
  display: "inline-flex",
  padding: 24,
  background: "var(--emerald)",
  borderRadius: "var(--r-md)",
};

export const Ramadan = () => (
  <div style={stage}>
    <EventDateChip ev={{ ...base, dateISO: "2026-03-14" }} />
  </div>
);

export const HariRaya = () => (
  <div style={stage}>
    <EventDateChip ev={{ ...base, dateISO: "2026-03-20", dateLabel: "Fri, 20 Mar" }} />
  </div>
);

export const YearEnd = () => (
  <div style={stage}>
    <EventDateChip ev={{ ...base, dateISO: "2026-12-05", dateLabel: "Sat, 5 Dec" }} />
  </div>
);
