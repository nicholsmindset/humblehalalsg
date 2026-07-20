import { FaqScreen } from "@/components/screens/pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { HOME_FAQ, VERIFY_FAQ, TRAVEL_FAQ, BUSINESS_FAQ } from "@/lib/faq";
import { HELP } from "@/lib/help-content";
import { getServerFlags } from "@/lib/feature-flags";

// Flag-gated content — flags are already 30s-cached in-process, so per-request
// rendering never reflected toggles "immediately" anyway. ISR every 5 min is
// plenty for FAQ toggles and drops the full layout DB fan-out on every hit.
export const revalidate = 300;

export const metadata = pageMeta({ title: "Frequently asked questions — Humble Halal", description: "Answers about finding halal places in Singapore, our trust badges and verification, our features (Ask AI, TikTok, Halal Passport and more), and Muslim-friendly travel.", path: "/faq" });

export default async function Page() {
  const flags = await getServerFlags();
  const featureFaqs = HELP.filter((h) => !h.flag || flags[h.flag]).flatMap((h) => h.faqs);
  const allFaqs = [...HOME_FAQ, ...VERIFY_FAQ, ...TRAVEL_FAQ, ...BUSINESS_FAQ, ...featureFaqs];
  return (
    <>
      <JsonLd data={[faqJsonLd(allFaqs), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }])]} />
      <FaqScreen flags={flags} />
    </>
  );
}
