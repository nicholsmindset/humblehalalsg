import { TransfersScreen } from "@/components/screens/transfers";
import { getServerFlags } from "@/lib/flags";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMeta({
  title: "Airport Transfers — Halal Travel",
  description: "Book private airport transfers worldwide for Umrah, Hajj and Muslim travel — door to door, fixed price, free cancellation on most rides.",
  path: "/travel/transfers",
});

const service = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Airport Transfer Booking",
  serviceType: "Ground transportation for Muslim travellers",
  provider: { "@type": "Organization", name: "Humble Halal", url: SITE.url },
  areaServed: "Worldwide",
  url: `${SITE.url}/travel/transfers`,
  description: "Private airport transfers worldwide, paired with Muslim-friendly hotels and flights for Umrah, Hajj and family travel.",
};

const faqs = [
  { q: "Are airport transfers available for Umrah?", a: "Yes. You can book private door-to-door airport transfers in Jeddah, Makkah, Madinah and worldwide, and pair them with a Muslim-friendly hotel." },
  { q: "Can I cancel a transfer?", a: "Most transfers offer free cancellation up to 24 hours before pickup. The exact policy is shown on each quote before you book." },
  { q: "How is payment handled?", a: "Payment is processed securely by our transfer partner at checkout; your card details are never stored by Humble Halal." },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[service, faqJsonLd(faqs), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Travel", path: "/travel" }, { name: "Transfers", path: "/travel/transfers" }])]} />
      <TransfersScreen bookingEnabled={getServerFlags().paidTransfers} />
    </>
  );
}
