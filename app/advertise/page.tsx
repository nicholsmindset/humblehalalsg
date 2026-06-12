import { AdvertiseScreen } from "@/components/screens/advertise";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Advertise with Humble Halal — reach Singapore's Muslim community",
  description:
    "Advertise your halal or Muslim-friendly brand on Humble Halal: featured listings, homepage spotlights, category sponsorships, newsletter placements and event promotion.",
  path: "/advertise",
});

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "For Business", path: "/for-business" },
          { name: "Advertise", path: "/advertise" },
        ])}
      />
      <AdvertiseScreen />
    </>
  );
}
