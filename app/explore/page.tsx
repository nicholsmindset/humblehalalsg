import { ExploreScreen } from "@/components/screens/consumer";
import { pageMeta } from "@/lib/seo";
import { getDirectory } from "@/lib/directory";
import { JsonLd, itemListJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({ title: "Halal Food Near Me in Singapore — Explore & Filter", description: "Search halal restaurants, cafés and Muslim-owned shops near you in Singapore — filter by area, cuisine, price, prayer space and halal status.", path: "/explore", absoluteTitle: true });

export default async function Page() {
  // ItemList structured data for the directory listing (SEO + schema gate).
  const listings = (await getDirectory()).slice(0, 50);
  return (
    <>
      <JsonLd
        data={[
          itemListJsonLd(listings, "Halal places in Singapore"),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Explore", path: "/explore" },
          ]),
        ]}
      />
      <ExploreScreen />
    </>
  );
}
