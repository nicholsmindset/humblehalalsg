import type { Metadata } from "next";
import { pageMeta, SITE } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { JsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { Faq } from "@/components/faq";
import { IngredientChecker } from "@/components/tools/ingredient-checker";
import { ADDITIVES, ADDITIVE_COUNT, countByStatus } from "@/lib/tools/ingredients";

export const metadata: Metadata = pageMeta({
  title: "Is this ingredient halal? E-number & additive checker",
  description:
    "Look up any food additive or E-number's halal status — halal, doubtful (mushbooh) or best avoided — with the reason. Search E471, gelatine, carmine and more. Free.",
  path: "/tools/ingredient-checker",
  absoluteTitle: true,
});

const FAQ = [
  {
    q: "Is E471 halal?",
    a: "E471 (mono- and diglycerides of fatty acids) is doubtful (mushbooh). The fatty acids can come from plants (halal) or animal fat (doubtful unless from a halal animal). Because manufacturers rarely state the source, treat it as doubtful and check with the maker or look for a halal-certified product.",
  },
  {
    q: "Is gelatine (E441) halal?",
    a: "Standard gelatine is usually made from pork or non-halal beef, so it is treated as non-halal. Halal-certified gelatine (from halal-slaughtered cattle) and plant-based gelling agents such as agar (E406), pectin (E440) and carrageenan (E407) are halal alternatives.",
  },
  {
    q: "What does 'mushbooh' or 'doubtful' mean?",
    a: "Mushbooh means an additive's permissibility is unclear because its source can be either animal or plant. Islam encourages avoiding the doubtful. In practice, confirm the source with the manufacturer or choose a product carrying halal certification.",
  },
  {
    q: "Is E120 / carmine halal?",
    a: "Carmine (E120, also called cochineal or natural red 4) is a red colour made from insects. Most scholars consider it impermissible, so it is best avoided. Plant-based red colours like beetroot red (E162) are halal alternatives.",
  },
  {
    q: "Does a product with only halal additives count as halal-certified?",
    a: "No. Halal certification looks at the whole product and process, not just additives. Even if every additive is halal, only a listing on the MUIS HalalSG register (or equivalent certification) confirms a product or eatery is halal-certified.",
  },
];

const itemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Halal status of common food additives and E-numbers",
  numberOfItems: ADDITIVES.length,
  itemListElement: ADDITIVES.filter((a) => a.code).slice(0, 60).map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `${a.code} — ${a.name}`,
    url: `${SITE.url}/tools/ingredient-checker#${a.code}`,
  })),
};

export default function Page() {
  return (
    <>
      <JsonLd data={[itemList, faqJsonLd(FAQ)]} />
      <ToolShell
        slug="ingredient-checker"
        title="Is this ingredient halal?"
        intro={`Check the halal status of ${ADDITIVE_COUNT}+ common food additives and E-numbers — ${countByStatus("halal")} generally halal, ${countByStatus("mushbooh")} doubtful, ${countByStatus("haram")} best avoided. Search by number (E471) or name (gelatine, carmine, MSG).`}
        foot={
          <div className="hh-section">
            <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>Questions people ask</h2>
            <Faq items={FAQ} />
          </div>
        }
      >
        <IngredientChecker />
      </ToolShell>
    </>
  );
}
