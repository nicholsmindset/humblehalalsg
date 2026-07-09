import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";

/* Authority guide for "halal certification singapore" (400/mo, KD 20, AIO).
   Humble Halal is NOT a certifier — this guide explains the official MUIS
   process and links every claim back to official sources. */

export const metadata: Metadata = pageMeta({
  title: `Halal Certification Singapore — Complete Guide (${SEO_YEAR})`,
  description:
    "How halal certification works in Singapore: what MUIS certification covers, the schemes, who qualifies, typical timelines and costs, and how to verify any certificate.",
  path: "/halal-certification-singapore-guide",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Who issues halal certification in Singapore?", a: "MUIS (Majlis Ugama Islam Singapura, the Islamic Religious Council of Singapore) is the sole authority that issues halal certification in Singapore. No other body can certify halal here — third-party 'halal' logos have no official standing." },
  { q: "How long does MUIS halal certification take?", a: "Straightforward applications typically take a few weeks to a few months from submission to certification, depending on the scheme, how prepared your premises and documentation are, and audit scheduling. Renewals are generally faster." },
  { q: "How much does halal certification cost in Singapore?", a: "Fees depend on the certification scheme and business size — MUIS publishes the current fee schedule on its website. Budget for application fees plus any operational changes (ingredient sourcing, storage separation, Muslim staffing requirements)." },
  { q: "How do I check if a business is really halal-certified?", a: "Search the official MUIS HalalSG register (halal.muis.gov.sg) or the HalalSG app — every valid certificate is listed there. A wall sticker or 'no pork no lard' sign is not proof of certification." },
  { q: "Is 'Muslim-owned' the same as halal-certified?", a: "No. Muslim-owned businesses often follow halal practices but do not automatically hold MUIS certification (many home-based businesses aren't eligible). On Humble Halal both statuses are labelled separately so you always know which is which." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "For business", path: "/for-business" },
        { name: "Halal certification guide", path: "/halal-certification-singapore-guide" },
      ]}
      h1={`Halal Certification in Singapore — The Complete Guide (${SEO_YEAR})`}
      intro={
        <>
          <strong>Halal certification in Singapore is issued solely by MUIS</strong> (Majlis Ugama Islam Singapura). A MUIS
          certificate means the premises, ingredients, and handling have been audited against the official halal standard —
          and every valid certificate is verifiable on the public HalalSG register. This guide explains the schemes, the
          process, timelines and costs.
        </>
      }
      sections={[
        {
          heading: "What MUIS halal certification covers",
          body: (
            <>
              <p>
                MUIS certification is premises-and-scheme based, not brand based. The main schemes are: <strong>Eating
                Establishment</strong> (restaurants, cafés, hawker stalls, canteens), <strong>Food Preparation Area</strong>{" "}
                (central kitchens, caterers), <strong>Endorsement</strong> (locally manufactured or repacked products),{" "}
                <strong>Storage Facility</strong> and <strong>Poultry Abattoir</strong>. A company with five outlets needs
                each outlet certified — one certified branch does not make the whole chain halal.
              </p>
              <p style={{ marginTop: 10 }}>
                Certification requires halal-compliant sourcing, dedicated storage and preparation, a trained internal{" "}
                <strong>Halal Team</strong> including Muslim staff, and ongoing compliance — MUIS conducts audits and can
                suspend certificates.
              </p>
            </>
          ),
        },
        {
          heading: "The process at a glance",
          body: (
            <ol style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Prepare</strong> — align ingredients and suppliers (halal-certified sources), separate storage/prep, appoint your Halal Team with the required Muslim staff.</li>
              <li><strong>Apply</strong> — submit via the GoBusiness licensing portal with supporting documents (ingredient lists, supplier certs, premises layout, staff details).</li>
              <li><strong>Audit</strong> — MUIS reviews the application and conducts an on-site audit; you may be asked to rectify gaps.</li>
              <li><strong>Certify & maintain</strong> — on approval you receive the certificate and appear on the HalalSG register. Maintain compliance, display the cert, and renew before expiry.</li>
            </ol>
          ),
        },
        {
          heading: "Verifying a certificate",
          body: (
            <p>
              Every valid MUIS certificate is listed on the official{" "}
              <a href="https://www.halal.gov.sg" target="_blank" rel="noopener noreferrer">HalalSG register</a>. On Humble
              Halal, listings marked <strong>MUIS Certified</strong> link to the register so you can confirm the certificate
              yourself — we surface official status, we never issue it. See{" "}
              <Link href="/verify">how our trust badges work</Link>.
            </p>
          ),
        },
      ]}
      links={[
        { label: "How to get MUIS halal-certified — step by step", href: "/how-to-get-halal-certified-muis" },
        { label: "MUIS certification explained (schemes & meaning)", href: "/muis-halal-certification-explained" },
        { label: "MUIS halal-certified directory", href: "/muis-halal-certified-directory" },
        { label: "Is this brand halal? checker", href: "/is-halal" },
        { label: "List your business on Humble Halal", href: "/add-listing" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Halal Certification in Singapore — The Complete Guide (${SEO_YEAR})`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/halal-certification-singapore-guide`,
        },
      ]}
    />
  );
}
