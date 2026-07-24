import { EventCard, PreviewShell } from "humblehalalsg";
import type { ComponentProps } from "react";

type Ev = ComponentProps<typeof EventCard>["ev"];

const ramadanBazaar: Ev = {
  id: "ev-geylang-bazaar",
  slug: "geylang-serai-ramadan-bazaar",
  title: "Geylang Serai Ramadan Bazaar 2026",
  catId: "bazaar",
  cat: "Bazaar",
  img: "",
  tone: "gold",
  free: true,
  priceFrom: 0,
  dateLabel: "Sat, 14 Mar",
  timeLabel: "4:00 PM – 11:00 PM",
  dateISO: "2026-03-14",
  venue: "Wisma Geylang Serai",
  area: "Geylang",
  capacity: 0,
  taken: 0,
  organiserId: null,
  organiser: "Wisma Geylang Serai",
  organiserBiz: false,
  blurb: "Street food, raya fashion and family stalls through the fasting month.",
  tags: ["Halal food", "Family friendly"],
  prayerNearby: true,
  halalCatering: true,
  featured: true,
  attendees: 0,
  genderArrangement: "mixed",
};

const tafsirClass: Ev = {
  id: "ev-tafsir-class",
  slug: "weekend-tafsir-sisters",
  title: "Weekend Tafsir Circle — Surah Al-Kahf",
  catId: "talim",
  cat: "Ta'lim & class",
  img: "",
  tone: "emerald",
  free: true,
  priceFrom: 0,
  dateLabel: "Sun, 26 Apr",
  timeLabel: "10:00 AM – 12:00 PM",
  dateISO: "2026-04-26",
  venue: "Masjid Al-Ansar",
  area: "Bedok",
  capacity: 60,
  taken: 52,
  organiserId: null,
  organiser: "Darul Ilm SG",
  organiserBiz: false,
  blurb: "A relaxed weekly circle unpacking the themes of Surah Al-Kahf with Ustazah Nurul.",
  tags: ["Prayer space", "Sisters only"],
  prayerNearby: true,
  halalCatering: false,
  featured: false,
  attendees: 52,
  genderArrangement: "sisters",
};

export const RamadanBazaar = () => (
  <PreviewShell>
    <div style={{ maxWidth: 340 }}>
      <EventCard ev={ramadanBazaar} />
    </div>
  </PreviewShell>
);

export const ClassAlmostFull = () => (
  <PreviewShell>
    <div style={{ maxWidth: 340 }}>
      <EventCard ev={tafsirClass} />
    </div>
  </PreviewShell>
);

export const RowVariant = () => (
  <PreviewShell>
    <div style={{ maxWidth: 460 }}>
      <EventCard ev={ramadanBazaar} variant="row" />
    </div>
  </PreviewShell>
);
