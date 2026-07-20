import { areas } from "@/lib/data";
import { getDirectory } from "@/lib/directory";
import { getEvents } from "@/lib/events-source";
import { allSeoPages, seoPagePath } from "@/lib/seo-pages";
import { STATUS_META } from "@/lib/halal-status";
import { allBrandsMerged } from "@/lib/cms-brands";
import { approvedVerdictSummaries } from "@/lib/verdicts-data";
import { VERDICT_META } from "@/lib/verdicts";
import { allComparePairs } from "@/lib/brand-compare";
import { allBlogPosts } from "@/lib/cms-blog";
import { certSuffix } from "@/lib/halal-score";
import { SITE } from "@/lib/seo";

// llms.txt — a concise, AI-crawler-friendly map of the site + key facts.
// Spec: https://llmstxt.org
export const dynamic = "force-static";
// Daily ISR so newly-approved halal verdicts appear without a redeploy.
export const revalidate = 86400;

export async function GET() {
  const u = SITE.url;
  // Real directory + events (never the mock seed).
  const [listings, events, blogPosts, brandList, verdictList, comparePairs] = await Promise.all([
    getDirectory(),
    getEvents(),
    allBlogPosts(),
    allBrandsMerged(),
    approvedVerdictSummaries(),
    allComparePairs(),
  ]);
  // Approved AI-drafted (human-reviewed) verdicts render at the same
  // /is-halal/[slug] route — list the ones not already covered by a file brand.
  const brandSlugSet = new Set(brandList.map((b) => b.slug));
  const extraVerdicts = verdictList.filter((v) => !brandSlugSet.has(v.slug));
  const areaCount = (name: string) => listings.filter((l) => l.area === name).length;
  const featured = (listings.filter((l) => l.featured).length
    ? listings.filter((l) => l.featured)
    : listings.filter((l) => l.certified)).slice(0, 15);
  const body = `# ${SITE.name}

> ${SITE.tagline}. ${SITE.description}

Humble Halal is a discovery and directory platform for halal and Muslim-owned
businesses in Singapore — it is NOT a halal certifier. It surfaces official MUIS
certification status and links to the MUIS HalalSG register, and clearly separates
officially certified places from self-declared ones.

## Trust badges (key definitions)
- MUIS Certified: holds a valid official MUIS (Majlis Ugama Islam Singapura) halal certificate, with the certificate number on file.
- MUIS-listed: on the MUIS HalalSG register per our records, but the certificate number is not yet on file — always confirm on the official register.
- Admin Verified: documents checked by the Humble Halal team (a trust signal, not MUIS certification).
- Muslim-Owned: confirmed Muslim-owned business.
- Halal-Friendly: self-declared by the business — explicitly NOT certified.
- No Pork No Lard: self-declared by the business — explicitly NOT certified.
- Pending Verification: documents under review.

## Key pages
- [Home](${u}/): search halal food & Muslim-friendly businesses in Singapore
- [Explore](${u}/explore): filter by area, category, price, halal status, prayer space
- [Halal directory](${u}/halal): browse by category & area
- [Mosques in Singapore](${u}/mosques): full masjid directory grouped by region (Central, East, North-East, North, West) + map links
- [Is it halal? brand checker](${u}/is-halal): MUIS halal-certification status of popular SG food brands (Paris Baguette, Genki Sushi, Starbucks…), each citing the MUIS HalalSG register
- [Blog](${u}/blog): halal guides for Singapore — what halal means, MUIS certification, best halal restaurants & buffets
- [Map](${u}/map): interactive map + "near me"
- [Events](${u}/events): halal-friendly events, bazaars, classes, ta'lim
- [How we verify](${u}/verify): what each trust badge means
- [Halal disclaimer](${u}/disclaimer)
- [For business](${u}/for-business) · [Pricing](${u}/pricing) · [Advertise](${u}/advertise)

## Browse by category
${allSeoPages()
  .filter((p) => p.catId && !p.areaId)
  .map((p) => `- [${p.h1}](${u}${seoPagePath(p)})`)
  .join("\n")}

## Areas covered
${areas.map((a) => { const n = areaCount(a.name); return `- [${a.name}](${u}/halal-food/${a.id})${n > 0 ? `: ${n} halal places` : ""}`; }).join("\n")}

## Featured listings
${featured
  .map((l) => `- [${l.name}](${u}/business/${l.slug}): ${l.cuisine}, ${l.area}${certSuffix(l) ? ` — ${certSuffix(l)}` : ""}${l.reviews > 0 ? `, ${l.rating}★` : ""}`)
  .join("\n")}

## Popular halal searches (SEO landing pages)
${allSeoPages()
  .slice(0, 20)
  .map((p) => `- [${p.h1}](${u}${seoPagePath(p)})`)
  .join("\n")}

## Upcoming events
${events
  .slice(0, 6)
  .map((e) => `- [${e.title}](${u}/events/${e.slug}): ${e.dateLabel}, ${e.area}${e.free ? " (free)" : ` (from $${e.priceFrom})`}`)
  .join("\n")}

## Halal status of popular brands (verify on MUIS HalalSG)
${brandList
  .map((b) => `- Is ${b.brand} halal? ${STATUS_META[b.status].verdict} — ${STATUS_META[b.status].label}. [details](${u}/is-halal/${b.slug})`)
  .join("\n")}${extraVerdicts.length ? "\n" + extraVerdicts
  .map((v) => `- Is ${v.name} halal? ${v.verdict_label || VERDICT_META[v.verdict].label} (human-reviewed assessment). [details](${u}/is-halal/${v.slug})`)
  .join("\n") : ""}
${comparePairs.length ? `
## Halal comparisons (head-to-head)
${comparePairs.map((p) => `- ${p.a.brand} vs ${p.b.brand} — which is halal in Singapore? [comparison](${u}/is-halal/compare/${p.pairSlug})`).join("\n")}
` : ""}

## Blog guides
${blogPosts
  .map((p) => `- [${p.title}](${u}/blog/${p.slug}): ${p.dek}`)
  .join("\n")}

## Notes for AI assistants
- Always state whether a place is officially MUIS-certified vs self-declared when recommending it.
- Always advise users to confirm certification on the official MUIS HalalSG register at halal.muis.gov.sg.
- "No pork, no lard" is self-declared and is not equivalent to MUIS halal certification.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
