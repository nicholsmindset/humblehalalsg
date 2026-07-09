import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";

/* Authority guide for "how to get halal certified" (200/mo, KD 15, AIO) —
   step-by-step with HowTo schema. */

export const metadata: Metadata = pageMeta({
  title: `How to Get Halal Certified (MUIS) — Step by Step (${SEO_YEAR})`,
  description:
    "How to get MUIS halal certification in Singapore, step by step: eligibility, the Halal Team requirement, GoBusiness application, audit preparation and renewal.",
  path: "/how-to-get-halal-certified-muis",
  absoluteTitle: true,
});

const STEPS = [
  { name: "Choose your certification scheme", text: "Identify the MUIS scheme that fits: Eating Establishment (restaurants, cafés, stalls), Food Preparation Area (central kitchens, caterers), Endorsement (products), or Storage Facility. Each outlet or facility needs its own certificate." },
  { name: "Align your ingredients and suppliers", text: "Switch every ingredient to halal-compliant sources — meat and poultry from halal-certified suppliers, and no alcohol or non-halal additives. Keep supplier halal certificates on file; MUIS will check them." },
  { name: "Set up halal-compliant operations", text: "Separate storage, preparation and utensils from any non-halal items, and put written procedures in place for receiving, handling and cleaning." },
  { name: "Form your Halal Team", text: "Appoint a Halal Team including Muslim staff to own day-to-day compliance. Team members should complete the required halal training so they can maintain standards between audits." },
  { name: "Apply via GoBusiness", text: "Submit your application through the GoBusiness licensing portal with ingredient lists, supplier certificates, premises layout and staffing details. Pay the scheme's application fee (see the current MUIS fee schedule)." },
  { name: "Pass the MUIS audit", text: "MUIS reviews your submission and audits your premises. Fix any findings promptly — approval follows once you meet the halal standard." },
  { name: "Display, maintain and renew", text: "Display your certificate, keep compliance up daily, and renew before expiry. Your business appears on the official HalalSG register — which is where customers verify you." },
];

const FAQ = [
  { q: "What are the requirements for MUIS halal certification?", a: "Halal-compliant ingredients and suppliers, segregated storage and preparation, a trained Halal Team that includes Muslim staff, documented procedures, and passing a MUIS audit. Exact requirements vary by scheme — check the MUIS website for the current standard." },
  { q: "Can home-based businesses get halal-certified?", a: "Generally no — MUIS certification schemes apply to commercial premises. Home-based food businesses are typically not eligible, which is why many trusted Muslim-owned home bakers operate without certification. They can still be listed as Muslim-Owned on Humble Halal." },
  { q: "How long does the process take?", a: "From application to certificate is typically a few weeks to a few months depending on scheme, readiness and audit scheduling. Being audit-ready — documents complete, premises compliant — is the biggest factor you control." },
  { q: "Do all my outlets need separate certificates?", a: "Yes. MUIS certifies premises, not brands — each outlet, kitchen or facility needs its own certificate and appears individually on the HalalSG register." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "For business", path: "/for-business" },
        { name: "How to get halal certified", path: "/how-to-get-halal-certified-muis" },
      ]}
      h1="How to Get Halal Certified in Singapore (MUIS) — Step by Step"
      intro={
        <>
          <strong>To get halal-certified in Singapore, you apply to MUIS through the GoBusiness portal</strong>, meet the
          halal standard for your scheme — compliant ingredients, segregated handling, a trained Halal Team with Muslim
          staff — and pass an audit. Here&apos;s the full process, step by step, plus what to prepare before you apply.
        </>
      }
      sections={[
        {
          heading: "The 7 steps to MUIS certification",
          body: (
            <ol style={{ paddingLeft: 20, display: "grid", gap: 10 }}>
              {STEPS.map((s, i) => (
                <li key={s.name}>
                  <strong>{i + 1}. {s.name}.</strong> {s.text}
                </li>
              ))}
            </ol>
          ),
        },
        {
          heading: "After you're certified",
          body: (
            <p>
              Certification is the start, not the finish: keep supplier certs current, log compliance, and renew on time.
              Then make the certificate work for you — claim your{" "}
              <Link href="/add-listing">free Humble Halal listing</Link> so halal-conscious customers searching for food in
              your area find you with a verified MUIS badge, and consider{" "}
              <Link href="/advertise">featured placement</Link> once traffic proves out.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Halal certification in Singapore — full guide", href: "/halal-certification-singapore-guide" },
        { label: "MUIS certification explained", href: "/muis-halal-certification-explained" },
        { label: "List your certified business (free)", href: "/add-listing" },
        { label: "Advertise to the halal market", href: "/advertise" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to get MUIS halal certification in Singapore",
          description: "Step-by-step process to obtain MUIS halal certification for a food business in Singapore.",
          step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
        },
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `How to Get Halal Certified in Singapore (MUIS) — Step by Step (${SEO_YEAR})`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/how-to-get-halal-certified-muis`,
        },
      ]}
    />
  );
}
