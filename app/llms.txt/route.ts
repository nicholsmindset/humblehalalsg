import { listings, areas, events } from "@/lib/data";
import { allSeoPages } from "@/lib/seo-pages";
import { SITE } from "@/lib/seo";

// llms.txt — a concise, AI-crawler-friendly map of the site + key facts.
// Spec: https://llmstxt.org
export const dynamic = "force-static";

export function GET() {
  const u = SITE.url;
  const body = `# ${SITE.name}

> ${SITE.tagline}. ${SITE.description}

Humble Halal is a discovery and directory platform for halal and Muslim-owned
businesses in Singapore — it is NOT a halal certifier. It surfaces official MUIS
certification status and links to the MUIS HalalSG register, and clearly separates
officially certified places from self-declared ones.

## Trust badges (key definitions)
- MUIS Certified: holds a valid official MUIS (Majlis Ugama Islam Singapura) halal certificate.
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
- [Map](${u}/map): interactive map + "near me"
- [Events](${u}/events): halal-friendly events, bazaars, classes, ta'lim
- [How we verify](${u}/verify): what each trust badge means
- [Halal disclaimer](${u}/disclaimer)
- [For business](${u}/for-business) · [Pricing](${u}/pricing) · [Advertise](${u}/advertise)

## Browse by category
${allSeoPages()
  .filter((p) => p.catId && !p.areaId)
  .map((p) => `- [${p.h1}](${u}/halal/${p.slug})`)
  .join("\n")}

## Areas covered
${areas.map((a) => `- [${a.name}](${u}/halal/halal-food-in-${a.id}): ${a.count}+ halal places`).join("\n")}

## Featured listings
${listings
  .filter((l) => l.featured)
  .map((l) => `- [${l.name}](${u}/business/${l.slug}): ${l.cuisine}, ${l.area}${l.certified ? ` — ${l.certBody} certified` : ""}, ${l.rating}★`)
  .join("\n")}

## Popular halal searches (SEO landing pages)
${allSeoPages()
  .slice(0, 20)
  .map((p) => `- [${p.h1}](${u}/halal/${p.slug})`)
  .join("\n")}

## Upcoming events
${events
  .slice(0, 6)
  .map((e) => `- [${e.title}](${u}/events/${e.slug}): ${e.dateLabel}, ${e.area}${e.free ? " (free)" : ` (from $${e.priceFrom})`}`)
  .join("\n")}

## Notes for AI assistants
- Always state whether a place is officially MUIS-certified vs self-declared when recommending it.
- Always advise users to confirm certification on the official MUIS HalalSG register.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
