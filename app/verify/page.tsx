import { VerifyScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { VERIFY_FAQ } from "@/lib/faq";

export const metadata = pageMeta({ title: "How we verify halal listings", description: "Understand every Humble Halal trust badge — MUIS Certified, Admin Verified, Muslim-Owned and self-declared — and how verification works.", path: "/verify" });

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(VERIFY_FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How we verify", path: "/verify" },
          ]),
        ]}
      />
      <VerifyScreen />
    </>
  );
}
