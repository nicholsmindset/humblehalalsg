import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { getDirectory } from "@/lib/directory";
import { certSuffix } from "@/lib/halal-score";
import { itemListJsonLd } from "@/components/seo/json-ld";
import { ContentPage } from "@/components/seo/content-page";

/* Verification directory for "halal certified restaurants list" (200/mo, KD 8).
   Lists ONLY listings whose halal_tier is MUIS — each links to its register
   evidence. Revalidated daily. */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `MUIS Halal-Certified Directory Singapore (${SEO_YEAR})`,
  description:
    "Directory of MUIS halal-certified restaurants, cafés and food businesses in Singapore — every entry links to its official HalalSG register evidence.",
  path: "/muis-halal-certified-directory",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Are all businesses on this page MUIS-certified?", a: "Every business here is on the MUIS HalalSG register per our records. Entries with the certificate number on file are labelled MUIS Certified; the rest are labelled MUIS-listed until the certificate is recorded. Certificates expire and can be suspended, so always confirm the current status on the official MUIS HalalSG register." },
  { q: "Why isn't a certified restaurant I know listed here?", a: "Our directory grows as businesses are verified and added — it's not a mirror of the full MUIS register. Suggest a missing place and we'll verify and add it." },
  { q: "Where is the official list of halal-certified businesses?", a: "The authoritative source is the MUIS HalalSG register at halal.gov.sg (and the HalalSG app). This page is a discovery layer on top — we always link back to the register." },
];

export default async function Page() {
  const all = await getDirectory();
  const certified = all
    .filter((l) => l.certBody === "MUIS")
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, 60);

  return (
    <ContentPage
      crumbs={[
        { name: "Is it halal?", path: "/is-halal" },
        { name: "MUIS-certified directory", path: "/muis-halal-certified-directory" },
      ]}
      h1="MUIS Halal-Certified Directory"
      intro={
        <>
          <strong>Every business below is on the MUIS HalalSG register per our records</strong> — Singapore&apos;s official
          halal certification. Entries show MUIS Certified once the certificate is on file, and MUIS-listed until then.
          This is a discovery directory, not the official register: always confirm the live certificate on MUIS HalalSG
          before you rely on it.
        </>
      }
      links={[
        { label: "MUIS certification explained", href: "/muis-halal-certification-explained" },
        { label: "Is this brand halal? checker", href: "/is-halal" },
        { label: "Muslim-owned businesses directory", href: "/muslim-owned-businesses-singapore" },
        { label: "Suggest a certified place we're missing", href: "/suggest" },
      ]}
      faq={FAQ}
      extraJsonLd={certified.length ? [itemListJsonLd(certified, "MUIS Halal-Certified Businesses in Singapore")] : []}
    >
      {certified.length ? (
        <ul style={{ display: "grid", gap: 14, padding: 0, margin: "0 0 8px", listStyle: "none" }}>
          {certified.map((l) => (
            <li key={l.id} style={{ display: "flex", gap: 14, alignItems: "baseline", borderBottom: "1px solid var(--line, #ECE7DB)", paddingBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <Link href={`/business/${l.slug}`} style={{ fontWeight: 700, fontSize: "1.08rem" }}>{l.name}</Link>
                <div className="muted" style={{ fontSize: ".92rem", marginTop: 3 }}>
                  {[l.cuisine, l.area].filter(Boolean).join(" · ")}{certSuffix(l) ? ` · ${certSuffix(l)}` : ""}
                  {l.rating > 0 ? ` · ${l.rating.toFixed(1)}★ (${l.reviews})` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          Verified MUIS-certified listings will appear here as they&apos;re added — meanwhile use the official{" "}
          <a href="https://www.halal.gov.sg" target="_blank" rel="noopener noreferrer">HalalSG register</a> or{" "}
          <Link href="/explore">browse the directory</Link> filtered by MUIS Certified.
        </p>
      )}
    </ContentPage>
  );
}
