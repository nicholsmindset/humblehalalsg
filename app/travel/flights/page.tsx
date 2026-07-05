import { FlightsScreen } from "@/components/screens/flights";
import { getServerFlags } from "@/lib/feature-flags";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Flights — Halal Travel",
  description: "Search hundreds of airlines for Umrah, Hajj and Muslim travel, and plan flights alongside your halal-friendly hotel.",
  path: "/travel/flights",
});

// Revalidate hourly so flag flips (paidFlights) apply without a redeploy — was a
// static page that baked the flag at build time and never updated.
export const revalidate = 3600;

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Halal Flight Search & Booking",
  serviceType: "Flight booking for Muslim travellers",
  provider: { "@type": "Organization", name: "Humble Halal", url: SITE.url },
  areaServed: "Worldwide",
  url: `${SITE.url}/travel/flights`,
  description: "Search and book flights for Umrah, Hajj and Muslim travel — with Muslim meal guidance, prayer-room layovers and qibla at your destination.",
};

const faqs = [
  { q: "Do you show which airlines offer a Muslim meal?", a: "Yes. Flight results flag carriers that offer a Muslim meal (MOML) on request, and note alcohol-free cabins where applicable. Always confirm the meal with the airline." },
  { q: "Can I see prayer facilities for my layover?", a: "Yes. For connecting airports with a documented prayer room or musalla, we show the facility and whether your layover is long enough to pray comfortably, plus the qibla direction at your destination." },
  { q: "Can I book flights and a hotel together?", a: "You can search flights and pair them with a Muslim-friendly hotel — with prayer rooms, halal dining nearby and alcohol-free options — in one place." },
];

export default async function Page() {
  return (
    <>
      <JsonLd data={[service, faqJsonLd(faqs), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Travel", path: "/travel" }, { name: "Flights", path: "/travel/flights" }])]} />
      <FlightsScreen bookingEnabled={(await getServerFlags()).paidFlights} />
    </>
  );
}
