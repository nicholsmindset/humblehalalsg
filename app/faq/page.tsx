import { FaqScreen } from "@/components/screens/pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { HOME_FAQ, VERIFY_FAQ } from "@/lib/faq";

export const metadata = pageMeta({ title: "Frequently asked questions — Humble Halal", description: "Answers about finding halal places in Singapore, our trust badges and verification, and booking Muslim-friendly hotels & flights for Umrah, Hajj and Muslim travel.", path: "/faq" });

export default function Page() {
  return (<><JsonLd data={[faqJsonLd([...HOME_FAQ, ...VERIFY_FAQ]), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }])]} /><FaqScreen /></>);
}
