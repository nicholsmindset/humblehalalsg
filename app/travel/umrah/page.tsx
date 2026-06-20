import type { Metadata } from "next";
import { UmrahHubScreen, UMRAH_FAQ } from "@/components/screens/travel";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, articleJsonLd } from "@/components/seo/json-ld";

const TITLE = "Umrah from Singapore — Muslim-Friendly Hotels & Flights";
const DESC = "Plan Umrah from Singapore: compare Muslim-friendly hotels near Masjid al-Haram and Al-Masjid an-Nabawi, search live flights to Jeddah and Medina, and read an answer-first Umrah guide.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESC, path: "/travel/umrah" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Travel", path: "/travel" },
            { name: "Umrah", path: "/travel/umrah" },
          ]),
          articleJsonLd({ headline: TITLE, description: DESC, path: "/travel/umrah" }),
          faqJsonLd(UMRAH_FAQ),
        ]}
      />
      <UmrahHubScreen />
    </>
  );
}
