import type { Metadata } from "next";
import { GrowthPartnerScreen } from "@/components/screens/pages";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Humble Halal Growth Partner — managed marketing intake",
  description: "Tell us your budget, current marketing and growth goals before we recommend a managed marketing package.",
  path: "/growth-partner",
});

export default function Page() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Growth Partner", path: "/growth-partner" }])]} />
      <GrowthPartnerScreen />
    </>
  );
}
