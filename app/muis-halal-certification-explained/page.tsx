import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";

/* Authority guide for "muis halal certification" (300/mo, KD 18, AIO) —
   consumer-angle explainer: what the mark means and how to verify it. */

export const metadata: Metadata = pageMeta({
  title: `MUIS Halal Certification Explained (${SEO_YEAR}) — What It Means`,
  description:
    "What MUIS halal certification actually means in Singapore — what the certificate covers, what it doesn't, the difference from 'no pork no lard', and how to verify any claim on HalalSG.",
  path: "/muis-halal-certification-explained",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What does MUIS halal-certified mean?", a: "It means the specific premises passed MUIS's halal audit — ingredients, preparation, storage and staffing meet Singapore's official halal standard, verified by the Islamic Religious Council of Singapore. The certificate is premises-specific and time-limited." },
  { q: "Is 'no pork, no lard' halal?", a: "Not necessarily. 'No pork, no lard' is a self-declaration — dishes can still involve alcohol, non-halal meat sources or cross-contamination. Only a valid MUIS certificate is official halal certification in Singapore." },
  { q: "Does a halal logo on the wall guarantee certification?", a: "No — check the actual register. Certificates expire and can be suspended, and unofficial logos exist. Search the business on the MUIS HalalSG register (halal.gov.sg) or the HalalSG app for the authoritative answer." },
  { q: "Are Muslim-owned businesses automatically halal?", a: "Muslim-owned businesses typically follow halal practices, but ownership is not certification. Many excellent Muslim-owned home businesses aren't eligible for MUIS certification at all. Humble Halal labels the two statuses separately." },
  { q: "Is food from Malaysia (JAKIM halal) accepted in Singapore?", a: "JAKIM is Malaysia's authority and its certification applies to products, which MUIS may recognise for import — but a Singapore eatery still needs its own MUIS certificate for its premises to be 'halal-certified' here." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Is it halal?", path: "/is-halal" },
        { name: "MUIS certification explained", path: "/muis-halal-certification-explained" },
      ]}
      h1="MUIS Halal Certification, Explained"
      intro={
        <>
          <strong>MUIS halal certification is Singapore&apos;s only official halal mark</strong> — issued by the Islamic
          Religious Council of Singapore after auditing a premises&apos; ingredients, preparation, storage and staffing.
          Here&apos;s what the certificate covers, what it doesn&apos;t, and how to verify any halal claim in under a minute.
        </>
      }
      sections={[
        {
          heading: "What the certificate does — and doesn't — cover",
          body: (
            <>
              <p>
                A MUIS certificate applies to a <strong>specific premises and scheme</strong> for a <strong>limited
                period</strong>. It does not cover a brand&apos;s other outlets, delivery partners&apos; handling, or products made
                elsewhere. That&apos;s why one branch of a chain can be certified while others aren&apos;t — always check the
                specific outlet.
              </p>
              <p style={{ marginTop: 10 }}>
                The hierarchy of trust in Singapore: <strong>MUIS Certified</strong> (official, audited) →{" "}
                <strong>Muslim-Owned</strong> (credible, not certified) → <strong>self-declared</strong> (&quot;no pork no
                lard&quot;, &quot;halal-friendly&quot; — unverified). Humble Halal labels every listing with one of these plus a halal-confidence
                score, and links certified listings to the register.
              </p>
            </>
          ),
        },
        {
          heading: "How to verify in under a minute",
          body: (
            <ol style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li>Search the outlet on the official <a href="https://www.halal.gov.sg" target="_blank" rel="noopener noreferrer">HalalSG register</a> or app.</li>
              <li>Match the <strong>exact outlet address</strong> — certification is per premises.</li>
              <li>Check the certificate is <strong>current</strong> (not expired or suspended).</li>
              <li>Or check the business on <Link href="/explore">Humble Halal</Link> — MUIS-certified listings link straight to their register entry.</li>
            </ol>
          ),
        },
      ]}
      links={[
        { label: "MUIS halal-certified directory", href: "/muis-halal-certified-directory" },
        { label: "Is this brand halal? checker", href: "/is-halal" },
        { label: "Halal certification guide for businesses", href: "/halal-certification-singapore-guide" },
        { label: "How our trust badges work", href: "/verify" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `MUIS Halal Certification Explained (${SEO_YEAR})`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/muis-halal-certification-explained`,
        },
      ]}
    />
  );
}
