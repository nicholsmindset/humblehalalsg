import { HawkerFinder } from "humblehalalsg";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof HawkerFinder>;
type Centre = Props["centres"][number];

const regions: Props["regions"] = [
  { id: "Central", label: "Central" },
  { id: "East", label: "East" },
  { id: "North-East", label: "North-East" },
  { id: "North", label: "North" },
  { id: "West", label: "West" },
];

const centres: Centre[] = [
  {
    id: "geylang-serai-market", name: "Geylang Serai Market & Food Centre", region: "East",
    address: "1 Geylang Serai", nearestMrt: "Paya Lebar MRT", hours: "7:00 AM – 9:00 PM",
    lat: 1.3178, lng: 103.8967,
  },
  {
    id: "maxwell-food-centre", name: "Maxwell Food Centre", region: "Central",
    address: "1 Kadayanallur Street", nearestMrt: "Maxwell MRT", hours: "8:00 AM – 10:00 PM",
    lat: 1.2803, lng: 103.8446,
  },
  {
    id: "tekka-centre", name: "Tekka Centre", region: "Central",
    address: "665 Buffalo Road", nearestMrt: "Little India MRT", hours: "6:30 AM – 9:00 PM",
    lat: 1.3061, lng: 103.8496,
  },
  {
    id: "old-airport-road", name: "Old Airport Road Food Centre", region: "Central",
    address: "51 Old Airport Road", nearestMrt: "Dakota MRT", hours: "Hours vary by stall",
    lat: 1.3082, lng: 103.8853,
  },
  {
    id: "chomp-chomp", name: "Chomp Chomp Food Centre", region: "North-East",
    address: "20 Kensington Park Road", nearestMrt: "Serangoon MRT", hours: "5:00 PM – 12:00 AM",
    lat: 1.3644, lng: 103.8686,
  },
  {
    id: "yishun-park", name: "Yishun Park Hawker Centre", region: "North",
    address: "51 Yishun Avenue 11", nearestMrt: "Yishun MRT", hours: "7:00 AM – 10:00 PM",
    lat: 1.4247, lng: 103.8352,
  },
];

const aggregates: Props["aggregates"] = {
  "geylang-serai-market": { count: 34, muis: 18, muslimOwned: 28 },
  "maxwell-food-centre": { count: 12, muis: 4, muslimOwned: 6 },
  "tekka-centre": { count: 21, muis: 9, muslimOwned: 14 },
  "old-airport-road": { count: 16, muis: 5, muslimOwned: 7 },
  "chomp-chomp": { count: 8, muis: 2, muslimOwned: 3 },
  "yishun-park": { count: 11, muis: 6, muslimOwned: 9 },
};

export const Islandwide = () => (
  <div style={{ maxWidth: 960 }}>
    <HawkerFinder centres={centres} aggregates={aggregates} regions={regions} />
  </div>
);

export const EastCentres = () => (
  <div style={{ maxWidth: 960 }}>
    <HawkerFinder
      centres={centres.filter((c) => ["East", "North-East"].includes(c.region || ""))}
      aggregates={aggregates}
      regions={regions}
    />
  </div>
);
