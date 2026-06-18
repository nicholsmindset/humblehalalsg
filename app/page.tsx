import { HomeScreen } from "@/components/screens/consumer";
import { JsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { HOME_FAQ } from "@/lib/faq";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Humble Halal — Halal Food & Muslim-Owned Singapore",
  description:
    "Find halal food in Singapore — MUIS-certified & Muslim-owned restaurants, cafés, shops and services near you. A discovery platform, not a certifier.",
  path: "/",
  absoluteTitle: true,
});

export default function Page() {
  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQ)} />
      <HomeScreen />
    </>
  );
}
