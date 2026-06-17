import { TravelScreen } from "@/components/screens/travel";
import { allTravelHubs, getTravelHub } from "@/lib/travel-hubs";
import { cityHotels } from "@/lib/travel-data";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Halal Travel — Muslim-Friendly Hotels Worldwide",
  description:
    "Find Muslim-friendly hotels with prayer rooms, halal dining nearby and alcohol-free options — from Umrah stays near the Haramain to family trips across Asia.",
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
    description: "Muslim-friendly hotel guides for Umrah and Muslim travel destinations.",
  };
  return (
    <>
      <JsonLd data={[collection, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Travel", path: "/travel" }])]} />
      <TravelScreen cities={cities} recommended={recommended} nearby={nearby} />
    </>
  );
}
