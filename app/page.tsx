import { HomeScreen } from "@/components/screens/consumer";
import { JsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { HOME_FAQ } from "@/lib/faq";

export default function Page() {
  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQ)} />
      <HomeScreen />
    </>
  );
}
