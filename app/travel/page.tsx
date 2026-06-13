import { TravelScreen } from "@/components/screens/travel";
import { allTravelHubs } from "@/lib/travel-hubs";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Halal Travel — Muslim-Friendly Hotels Worldwide",
  description:
    "Find Muslim-friendly hotels with prayer rooms, halal dining nearby and alcohol-free options — from Umrah stays near the Haramain to family trips across Asia.",
  path: "/travel",
});

export default function Page() {
  const cities = allTravelHubs();
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
      <TravelScreen cities={cities} />
    </>
  );
}
