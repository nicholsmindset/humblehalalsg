import { EventPriceTag } from "humblehalalsg";
import type { ComponentProps } from "react";

type Ev = ComponentProps<typeof EventPriceTag>["ev"];

const base: Ev = {
  id: "ev-1",
  title: "Halal Food Festival",
  catId: "bazaar",
  cat: "Bazaar",
  img: "",
  tone: "gold",
  free: false,
  priceFrom: 18,
  dateLabel: "Sat, 14 Mar",
  timeLabel: "11:00 AM",
  dateISO: "2026-03-14",
  venue: "Kampong Gelam",
  area: "Bugis",
  capacity: 200,
  taken: 84,
  organiserId: null,
  organiser: "Wardah Books",
  organiserBiz: false,
  blurb: "A weekend of halal street food and artisan stalls.",
  tags: ["Halal food"],
  prayerNearby: true,
  halalCatering: true,
  featured: false,
  attendees: 84,
};

const wrap: React.CSSProperties = {
  display: "inline-flex",
  padding: 20,
  background: "var(--cream)",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--line)",
};

export const Free = () => (
  <div style={wrap}>
    <EventPriceTag ev={{ ...base, free: true, priceFrom: 0 }} free />
  </div>
);

export const Paid = () => (
  <div style={wrap}>
    <EventPriceTag ev={{ ...base, priceFrom: 18 }} free={false} />
  </div>
);

export const PaidLarge = () => (
  <div style={wrap}>
    <EventPriceTag ev={{ ...base, priceFrom: 45 }} free={false} lg />
  </div>
);
