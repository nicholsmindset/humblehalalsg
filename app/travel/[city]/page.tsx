import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TravelCityScreen } from "@/components/screens/travel";
import { allTravelHubs, getTravelHub, travelHubFaq, relatedHubs } from "@/lib/travel-hubs";
import { cityHotels, cityPriceTip } from "@/lib/travel-data";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, hotelJsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

export function generateStaticParams() {
  return allTravelHubs().map((h) => ({ city: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const h = getTravelHub(city);
  if (!h) return pageMeta({ title: "Halal travel", path: `/travel/${city}` });
  return pageMeta({ title: h.title, description: h.blurb, path: `/travel/${h.slug}` });
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const hub = getTravelHub(city);
  if (!hub) notFound();

  const [hotels, priceTip] = await Promise.all([cityHotels(hub), cityPriceTip(hub.countryCode, hub.cityName)]);
  const faq = travelHubFaq(hub);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: hub.h1,
    numberOfItems: hotels.length,
    itemListElement: hotels.map((h, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE.url}/travel/hotel/${h.id}`,
      name: h.name,
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Travel", path: "/travel" },
            { name: hub.name, path: `/travel/${hub.slug}` },
          ]),
          faqJsonLd(faq),
          ...hotels.slice(0, 3).map((h) => hotelJsonLd(h)),
        ]}
      />
      <TravelCityScreen hub={hub} hotels={hotels} faq={faq} related={relatedHubs(hub.slug)} priceTip={priceTip} />
    </>
  );
}
