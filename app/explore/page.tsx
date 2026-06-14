import { ExploreScreen } from "@/components/screens/consumer";
import { pageMeta } from "@/lib/seo";
import { getDirectory } from "@/lib/directory";
import { JsonLd, itemListJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({ title: "Explore halal places in Singapore", description: "Search and filter halal restaurants, cafés, Muslim-owned shops and services across Singapore by area, price, halal status and more.", path: "/explore" });

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
