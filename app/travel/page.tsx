import { UnifiedTravelScreen } from "@/components/screens/travel";
import { allTravelHubs, getTravelHub } from "@/lib/travel-hubs";
import { cityHotels } from "@/lib/travel-data";
import { curatedFlightDeals } from "@/lib/flights-data";
import { getServerFlags } from "@/lib/flags";
import { TRAVEL_LANDING_FAQ } from "@/lib/travel-content";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Halal Travel — Muslim-Friendly Hotels & Flights Worldwide",
  description:
    "Muslim-friendly hotels with prayer rooms, halal dining nearby and alcohol-free options — plus prayer-aware flights for Umrah, Hajj and Muslim travel, in one place.",
  path: "/travel",
});

export const revalidate = 3600;

export default async function Page() {
  const cities = allTravelHubs();
  // Featured hub for "Recommended" (Umrah core) + a local hub for "Nearby".
  const recommendedHub = getTravelHub("mecca") || getTravelHub("medina");
  const nearbyHub = getTravelHub("singapore") || getTravelHub("kuala-lumpur");
  const [recommended, nearby] = await Promise.all([
    recommendedHub ? cityHotels(recommendedHub, 10) : Promise.resolve([]),
    nearbyHub ? cityHotels(nearbyHub, 10) : Promise.resolve([]),
  ]);

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Halal Travel",
    url: `${SITE.url}/travel`,
    description: "Muslim-friendly hotels and flights for Umrah, Hajj and Muslim travel destinations.",
  };
  const flags = getServerFlags();
  return (
    <>
      <JsonLd data={[collection, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Travel", path: "/travel" }]), faqJsonLd(TRAVEL_LANDING_FAQ)]} />
      <UnifiedTravelScreen
        cities={cities}
        recommended={recommended}
        nearby={nearby}
        flightDeals={curatedFlightDeals()}
        semanticEnabled={flags.semanticSearch}
        flightsBookingEnabled={flags.paidFlights}
        conciergeEnabled={flags.aiConcierge}
      />
    </>
  );
}
