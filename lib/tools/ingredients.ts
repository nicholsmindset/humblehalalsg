/* Humble Halal — "Is this ingredient/E-number halal?" reference dataset.

   ACCURACY POLICY (read before editing):
   - We classify additives by their COMMON ORIGIN, not by any specific product.
     A "halal" additive can still appear in a non-halal product, and a product
     using only halal additives is NOT thereby halal-certified.
   - When an additive can be EITHER animal- or plant-derived (source-dependent),
     it is "mushbooh" (doubtful) — never assume halal. This is the honest
     default and matches how MUIS/most halal bodies treat these.
   - "haram" here means the COMMON commercial source is impermissible (e.g.
     insect- or alcohol-derived, or gelatine from non-halal animals). A
     halal-certified version may still exist (e.g. halal gelatine, plant carmine
     substitutes) — the note says so.
   - Humble Halal is NOT a certifier. For any product, verify on the MUIS
     HalalSG register or with the manufacturer. This is general guidance only.

   DETAIL PAGES (indexable ingredient guides):
   - The lightweight fields (code/name/category/status/origin/note/aliases)
     power the search index and accordion — every entry has them.
   - The rich optional fields (slug, halalReasoning, description, sources,
     lastReviewed, faqs, …) power the per-ingredient detail page. An entry is
     only given a detail page + indexed + sitemapped when it clears the quality
     gate in `ingredientQualifies()` (see PHASE 9). Thin entries stay searchable
     as accordion rows only — we do NOT publish thin pages.
   - Do NOT fabricate a source, a review date, or a halal/health claim to make
     an entry "qualify". Leave the field out; the page will show what is missing
     as "Information not yet verified" and the entry stays inline.

   Sources: additive origin is well-documented reference chemistry; classifications
   follow the conservative consensus of published halal-additive guides. Per-page
   citations point to primary regulators (EFSA, Codex/FAO, UK FSA, EU law) and to
   MUIS HalalSG for the Singapore verification process — never to invent a ruling. */

export type AdditiveStatus = "halal" | "mushbooh" | "haram";

/** Where an additive comes from — drives the "synthetic / plant / animal …"
    line on the detail page. "variable" == source-dependent (mushbooh territory). */
export type OriginType =
  | "synthetic" | "plant" | "microbial" | "mineral" | "animal" | "insect" | "variable";

export type Confidence = "high" | "medium" | "low";

/** A citation shown in the detail page's "Sources & methodology" block. */
export interface IngredientSource {
  /** Human-readable title of the specific document/page. */
  title: string;
  /** Publishing organisation, e.g. "EFSA", "Codex Alimentarius (FAO/WHO)", "MUIS". */
  organisation: string;
  /** Absolute URL to a stable landing page. Optional for offline references. */
  url?: string;
  sourceType: "regulatory" | "scientific" | "reference" | "certification";
  /** ISO date the source was last checked. */
  accessedDate: string;
  /** Which claim on the page this source supports. */
  supports?: string;
}

export interface IngredientFaq {
  q: string;
  a: string;
}

export interface Additive {
  /** E-number, uppercase, no space, e.g. "E471". "" for name-only entries. */
  code: string;
  name: string;
  category: AdditiveCategory;
  status: AdditiveStatus;
  /** Short origin/why (the answer-first unit). */
  origin: string;
  /** Caveat — when a halal version exists, or what to check. */
  note?: string;
  /** Extra search terms (common names, spellings). */
  aliases?: string[];

  // ─────────────────────────────────────────────────────────────────────────
  // Rich detail-page fields — ALL OPTIONAL. Legacy/thin entries omit them and
  // stay as accordion rows. An entry needs the gate fields (see
  // `ingredientQualifies`) before it earns an indexable detail page.
  // ─────────────────────────────────────────────────────────────────────────
  /** Pinned canonical slug override. Defaults to `<code>-<name>` (see ingredientSlug). */
  slug?: string;
  /** International Numbering System code (often == E-number without the "E"). */
  insNumber?: string;
  /** Prose alternative names shown on the page (aliases stays search-only). */
  alternativeNames?: string[];
  /** Food-tech role, e.g. "Colour (yellow)", "Emulsifier". */
  fn?: string;
  confidence?: Confidence;
  originType?: OriginType;
  /** Answer-first one-liner (a fuller sentence than the terse `origin`). */
  originSummary?: string;
  /** WHY this status — the reasoning block. Required for an indexable page. */
  halalReasoning?: string;
  /** How to verify a specific product carrying this ingredient. */
  verificationAdvice?: string;
  /** "What is this ingredient" explainer. Required for an indexable page. */
  description?: string;
  /** How it is produced (kept separate from the ruling). */
  manufacturingSummary?: string;
  /** Product categories it MAY be found in (never "always contains"). */
  commonUses?: string[];
  /** Exact strings it can appear as on an ingredients list. */
  labelNames?: string[];
  /** Singapore-specific verification guidance (MUIS HalalSG, local brands). */
  singaporeGuidance?: string;
  /** Health/safety note — SEPARATE from halal status; sources-gated. */
  healthSummary?: string;
  /** Regulatory status (EFSA/EU/SFA) — SEPARATE from halal status; sources-gated. */
  regulatorySummary?: string;
  faqs?: IngredientFaq[];
  /** Canonical codes for the "related ingredients" rail. */
  relatedCodes?: string[];
  sources?: IngredientSource[];
  /** ISO date the classification was last reviewed. Required for an indexable page. */
  lastReviewed?: string;
  /** Manual kill-switch — set false to force an otherwise-qualifying entry noindex. */
  indexable?: boolean;
}

export type AdditiveCategory =
  | "Colour" | "Preservative" | "Antioxidant" | "Acidity regulator"
  | "Emulsifier & stabiliser" | "Thickener" | "Flavour enhancer"
  | "Sweetener" | "Glazing & wax" | "Anti-caking" | "Flour treatment" | "Other";

export const STATUS_META: Record<AdditiveStatus, { label: string; verdict: string; tone: string }> = {
  halal: { label: "Generally halal", verdict: "Halal", tone: "yes" },
  mushbooh: { label: "Doubtful — depends on source", verdict: "Doubtful", tone: "warn" },
  haram: { label: "Commonly non-halal — check for a certified version", verdict: "Avoid", tone: "no" },
};

/* Shared citations reused across several detail pages (kept as builders so each
   entry gets its own `accessedDate`/`supports` and we never share a mutable
   object reference between entries). */
const REVIEWED = "2026-07-18";
const muisSource = (supports = "Singapore halal verification process"): IngredientSource => ({
  title: "Halal Certification — HalalSG",
  organisation: "Majlis Ugama Islam Singapura (MUIS)",
  url: "https://www.muis.gov.sg/halal",
  sourceType: "certification",
  accessedDate: REVIEWED,
  supports,
});
const codexGsfa = (supports = "Approved uses and INS number"): IngredientSource => ({
  title: "General Standard for Food Additives (GSFA) Online Database",
  organisation: "Codex Alimentarius (FAO/WHO)",
  url: "https://www.fao.org/gsfaonline/index.html",
  sourceType: "regulatory",
  accessedDate: REVIEWED,
  supports,
});
const efsaTopic = (title: string, supports: string): IngredientSource => ({
  title,
  organisation: "European Food Safety Authority (EFSA)",
  url: "https://www.efsa.europa.eu/en/topics/topic/food-additives",
  sourceType: "scientific",
  accessedDate: REVIEWED,
  supports,
});
/** EU Annex V warning for the six "Southampton" colours (E102/104/110/122/124/129). */
const euAnnexV: IngredientSource = {
  title: "Annex V, Regulation (EC) No 1333/2008 — mandatory advisory statement for certain colours",
  organisation: "European Union (EUR-Lex)",
  url: "https://eur-lex.europa.eu/eli/reg/2008/1333/oj",
  sourceType: "regulatory",
  accessedDate: REVIEWED,
  supports: "'May have an adverse effect on activity and attention in children' label warning",
};

/* Curated list of the additives people most often search ("is E471 halal",
   "is gelatine halal", "is carmine halal"). Conservative by policy. Entries with
   the rich fields below have earned an indexable detail page. */
export const ADDITIVES: Additive[] = [
  // ── Colours ──────────────────────────────────────────────────────────────
  { code: "E100", name: "Curcumin", category: "Colour", status: "halal", origin: "Yellow colour from turmeric root — plant-derived.", aliases: ["turmeric"] },
  {
    code: "E101", name: "Riboflavin (Vitamin B2)", category: "Colour", status: "mushbooh",
    origin: "Yellow colour/vitamin; can be produced from microbial fermentation or animal-derived media.",
    note: "Synthetic and fermentation-based versions are halal — check the source.",
    aliases: ["riboflavin", "vitamin b2", "e101", "lactoflavin"],
    insNumber: "101",
    alternativeNames: ["Riboflavin", "Vitamin B2", "Lactoflavin", "Riboflavin-5'-phosphate"],
    fn: "Colour (yellow) / vitamin",
    confidence: "medium",
    originType: "variable",
    originSummary: "E101 (Riboflavin / Vitamin B2) is a yellow colour and vitamin that can be made synthetically, by microbial fermentation, or on animal-derived growth media — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Riboflavin is vitamin B2, also used as a yellow-orange food colour. It can be produced synthetically or by microbial fermentation; the fermentation medium can in some cases be animal-derived.",
    manufacturingSummary: "Made by chemical synthesis or by fermentation using microorganisms grown on a nutrient medium. The medium is usually plant-based, but can vary and is rarely stated.",
    halalReasoning: "Riboflavin itself is not a prohibited substance; the doubt is about production. Synthetic and plant-fermentation riboflavin is halal; where the growth medium may be animal-derived, the source should be confirmed. Because this is seldom stated, it is treated as doubtful until verified.",
    verificationAdvice: "Look for halal certification or a 'suitable for vegetarians/vegans' claim, or ask the manufacturer about the production method and medium.",
    commonUses: ["Cereals and dairy products", "Sauces and desserts", "Supplements and fortified foods", "Some soft drinks"],
    labelNames: ["Riboflavin", "Vitamin B2", "E101", "Colour (E101)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer if the production source is unclear.",
    faqs: [
      { q: "Is E101 (riboflavin) halal?", a: "It is usually halal (synthetic or plant-fermentation), but because the fermentation medium can vary and is rarely stated, it is treated as doubtful until confirmed." },
      { q: "Is Vitamin B2 from animals?", a: "It can be produced synthetically or by fermentation; most is not animal-derived, but the medium is not always stated. Confirm if you need certainty." },
      { q: "What names should I look for?", a: "'Riboflavin', 'Vitamin B2' or 'E101'." },
    ],
    relatedCodes: ["E100", "E160a", "E306"],
    sources: [efsaTopic("Re-evaluation of riboflavin (E 101) as a food additive", "Synthetic/fermentation production"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E102", name: "Tartrazine", category: "Colour", status: "halal",
    origin: "Synthetic azo dye — not animal-derived.",
    aliases: ["tartrazine", "yellow 5", "fd&c yellow 5", "e102"],
    insNumber: "102",
    alternativeNames: ["Yellow 5", "FD&C Yellow No. 5", "CI Food Yellow 4"],
    fn: "Colour (lemon-yellow)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E102 (Tartrazine) is a synthetic lemon-yellow azo dye made industrially from petrochemicals — it is not derived from animals.",
    description: "Tartrazine is a bright yellow synthetic colouring from the azo-dye family. It is fully manufactured in a chemical plant and has no animal or insect origin, which is why it is generally treated as halal at the ingredient level. It is often confused with E104 (Quinoline Yellow), a different yellow colour.",
    manufacturingSummary: "Produced by chemical synthesis (diazotisation and coupling of aromatic sulphonic acids). No animal-derived raw materials are used in the standard process.",
    halalReasoning: "Because Tartrazine is synthesised entirely from non-animal chemical feedstocks, there is no prohibited animal or alcohol component in the colour itself, so it is generally classified as halal at the ingredient level. As always, the colour being halal does not make the finished product halal-certified — carriers, other ingredients and the production line still matter.",
    verificationAdvice: "For a specific product, confirm the whole ingredient list and look for recognised halal certification rather than judging by the colour alone. If a liquid colour preparation is used, check that its carrier/solvent is not alcohol-based.",
    commonUses: ["Soft drinks and cordials", "Sweets and jellies", "Snack foods and sauces", "Instant desserts"],
    labelNames: ["Tartrazine", "E102", "Colour (E102)", "Yellow 5", "FD&C Yellow No. 5"],
    singaporeGuidance: "In Singapore, an ingredient being generally halal is not certification. Verify the finished product on the MUIS HalalSG register or contact the manufacturer if the colour's carrier is unclear.",
    regulatorySummary: "Permitted as a food colour in the EU, UK and many other markets. In the EU/UK, foods containing it must carry the advisory statement 'may have an adverse effect on activity and attention in children' (one of the six 'Southampton' colours).",
    faqs: [
      { q: "Is E102 (Tartrazine) halal or haram?", a: "Tartrazine is a synthetic dye with no animal origin, so it is generally considered halal at the ingredient level. This does not make the finished product halal-certified." },
      { q: "Is Tartrazine made from animals?", a: "No. It is manufactured by chemical synthesis from non-animal feedstocks." },
      { q: "Is E102 the same as E104?", a: "No. E102 (Tartrazine / Yellow 5) and E104 (Quinoline Yellow) are two different yellow colours, though both are synthetic and generally treated as halal at the ingredient level." },
      { q: "What names should I look for on a label?", a: "Look for 'Tartrazine', 'E102', 'Colour (E102)', 'Yellow 5' or 'FD&C Yellow No. 5'." },
    ],
    relatedCodes: ["E104", "E110", "E122", "E129"],
    sources: [efsaTopic("Re-evaluation of Tartrazine (E 102) as a food additive", "Safety re-evaluation and permitted-use status"), euAnnexV, codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E104", name: "Quinoline Yellow", category: "Colour", status: "halal",
    origin: "Synthetic dye.",
    aliases: ["quinoline yellow", "food yellow 13", "ci 47005", "e104"],
    insNumber: "104",
    alternativeNames: ["Quinoline Yellow WS", "Food Yellow 13", "CI 47005"],
    fn: "Colour (greenish-yellow)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E104, also known as Quinoline Yellow, is a synthetic food colouring and is generally considered halal because it is not normally derived from animals.",
    description: "Quinoline Yellow is a synthetic greenish-yellow food colouring. Chemically it is a water-soluble mixture of the disulfonated (mainly), monosulfonated and trisulfonated forms of 2-(2-quinolyl)indan-1,3-dione, listed under Colour Index number 47005 (Food Yellow 13). It is manufactured industrially rather than extracted from any plant, animal or insect, and is used to give foods, drinks and medicines a yellow shade. It should not be confused with E102 (Tartrazine), commonly called Yellow 5, which is a different yellow colour.",
    manufacturingSummary: "Made by chemical synthesis — the sulfonation of a quinoline-derived dye built from aromatic (historically coal-tar / petroleum) precursors. The standard commercial process uses no animal-derived raw materials, which is why it is assessed as synthetic in origin.",
    halalReasoning: "E104 is generally classified as halal at the ingredient level because its standard origin is synthetic and no prohibited carrier or animal-derived processing material is normally involved. However, this does not mean the finished product is halal-certified: formulations and supporting materials can differ, so the complete product and its certification must still be checked before consuming it.",
    verificationAdvice: "Judge the whole product, not the colour alone. Check the full ingredient list and any halal certification, and — where the source of a colour preparation or its carrier is unclear — contact the manufacturer.",
    commonUses: ["Sweets and confectionery", "Soft drinks and squashes", "Ice lollies and desserts", "Smoked fish coatings", "Some medicines and supplements"],
    labelNames: ["Quinoline Yellow", "E104", "Colour (E104)", "Food Yellow 13", "CI 47005"],
    singaporeGuidance: "Ingredient-level guidance is not halal certification. In Singapore, verify the complete product through the official MUIS HalalSG register where a certified version is expected, and contact the manufacturer when a colour's source or its carrier/solvent is unclear. We have not found an official MUIS ruling that names E104 specifically, so we classify it by its standard synthetic origin, not by any certification claim.",
    healthSummary: "Halal does not automatically mean healthy, and a health concern does not automatically make an ingredient haram. Quinoline Yellow was one of the colours in the 2007 University of Southampton study, which linked a mixture of certain colours plus a preservative to increased hyperactivity in some children. Following its 2009 re-evaluation, EFSA lowered the Acceptable Daily Intake for E104 from 10 to 0.5 mg per kg of body weight per day. These are food-safety assessments by regulators and are separate from its halal status.",
    regulatorySummary: "Permitted as a food colour in the EU and UK within set limits, where foods containing it must carry the advisory statement 'may have an adverse effect on activity and attention in children' (one of the six 'Southampton' colours). It is not authorised as a food colour in the United States — there it is permitted only in drugs and cosmetics, as D&C Yellow No. 10.",
    faqs: [
      { q: "Is E104 halal or haram?", a: "E104 (Quinoline Yellow) is generally considered halal at the ingredient level because its standard origin is synthetic, not animal. This does not by itself make a finished product halal-certified." },
      { q: "Is Quinoline Yellow made from animals?", a: "No. It is a synthetic colour manufactured by chemical processing, with no animal-derived raw material in the standard process." },
      { q: "What is Quinoline Yellow made of?", a: "It is a synthetic mixture of the disulfonated (mainly), monosulfonated and trisulfonated forms of 2-(2-quinolyl)indan-1,3-dione, listed as Colour Index 47005. It is built from aromatic precursors, not from any plant, animal or insect." },
      { q: "What is E104 used for?", a: "It is a greenish-yellow food colouring used to add or standardise colour in sweets, soft drinks, desserts and some medicines." },
      { q: "What foods may contain E104?", a: "It may be found in confectionery, soft drinks, ice lollies, some smoked fish coatings and certain medicines or supplements. 'May contain' is not the same as 'always contains'." },
      { q: "Is E104 (Quinoline Yellow) safe?", a: "Regulators permit E104 within limits. After its 2009 re-evaluation, EFSA lowered the acceptable daily intake to 0.5 mg per kg of body weight per day, and EU/UK foods that contain it must warn that it 'may have an adverse effect on activity and attention in children'. It is not authorised as a food colour in the US. Safety is a health question, separate from halal status." },
      { q: "Is E104 banned?", a: "It is not banned in the EU or UK, where it is allowed with a warning label, but it is not authorised as a food colour in the United States. Any safety restriction is separate from its halal status." },
      { q: "Does E104 make the finished product halal?", a: "No. A product is not automatically halal just because it contains a generally-halal colour. Certification looks at the whole product and process — check the full product and its halal certification." },
      { q: "What names should I look for on a label?", a: "Look for 'Quinoline Yellow', 'E104', 'Colour (E104)', 'Food Yellow 13' or 'CI 47005'." },
      { q: "How can I verify this ingredient in Singapore?", a: "Ingredient guidance is not certification. Check the complete product on the MUIS HalalSG register, and contact the manufacturer if a colour's source or carrier is unclear." },
    ],
    relatedCodes: ["E102", "E110", "E122", "E129"],
    sources: [
      {
        title: "Scientific Opinion on the re-evaluation of Quinoline Yellow (E 104) as a food additive (EFSA Journal 2009;7(11):1329)",
        organisation: "European Food Safety Authority (EFSA)",
        url: "https://www.efsa.europa.eu/en/efsajournal/pub/1329",
        sourceType: "scientific",
        accessedDate: REVIEWED,
        supports: "Synthetic composition, permitted uses and the lowered ADI of 0.5 mg/kg bw/day",
      },
      euAnnexV,
      codexGsfa("INS 104 and approved uses"),
      {
        title: "Quinoline Yellow WS — composition, Colour Index number and regulatory status",
        organisation: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Quinoline_Yellow_WS",
        sourceType: "reference",
        accessedDate: REVIEWED,
        supports: "Chemical composition (CI 47005) and US food-use status overview",
      },
      muisSource("Singapore verification is at the product level, not the ingredient level"),
    ],
    lastReviewed: REVIEWED,
  },

  {
    code: "E110", name: "Sunset Yellow FCF", category: "Colour", status: "halal",
    origin: "Synthetic azo dye.", aliases: ["orange yellow", "sunset yellow", "yellow 6", "fd&c yellow 6", "e110"],
    insNumber: "110",
    alternativeNames: ["Yellow 6", "FD&C Yellow No. 6", "Orange Yellow S", "CI Food Yellow 3"],
    fn: "Colour (orange-yellow)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E110 (Sunset Yellow FCF) is a synthetic orange-yellow azo dye with no animal origin, so it is generally treated as halal at the ingredient level.",
    description: "Sunset Yellow FCF is a synthetic orange-yellow colouring from the azo-dye family, manufactured industrially from petrochemical feedstocks. It has no plant, animal or insect source.",
    manufacturingSummary: "Produced by chemical synthesis (diazotisation and coupling of sulphonated aromatics). No animal-derived materials in the standard process.",
    halalReasoning: "As a fully synthetic colour with no animal or alcohol component, E110 is generally classified as halal at the ingredient level. The finished product still needs its own verification — a halal colour does not certify the product.",
    verificationAdvice: "Check the entire product and its certification rather than the colour alone; confirm any liquid-colour carrier is not alcohol-based.",
    commonUses: ["Soft drinks and orange squashes", "Sweets and snacks", "Sauces and instant soups", "Desserts"],
    labelNames: ["Sunset Yellow FCF", "E110", "Colour (E110)", "Yellow 6", "FD&C Yellow No. 6", "Orange Yellow S"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    regulatorySummary: "Permitted as a food colour in the EU and UK within limits; subject to the same 'Southampton colours' advisory warning label in the EU/UK.",
    faqs: [
      { q: "Is E110 (Sunset Yellow) halal?", a: "It is a synthetic dye with no animal origin, so it is generally considered halal at the ingredient level. The finished product still requires its own verification." },
      { q: "Is Sunset Yellow made from insects?", a: "No — that is carmine (E120). Sunset Yellow is fully synthetic." },
      { q: "What names should I look for?", a: "'Sunset Yellow FCF', 'E110', 'Yellow 6' or 'FD&C Yellow No. 6'." },
    ],
    relatedCodes: ["E102", "E104", "E122", "E129", "E120"],
    sources: [efsaTopic("Re-evaluation of Sunset Yellow FCF (E 110) as a food additive", "Synthetic origin and safety re-evaluation"), euAnnexV, codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E120", name: "Cochineal / Carmine / Carminic acid", category: "Colour", status: "haram",
    origin: "Red colour extracted from cochineal insects.",
    note: "Most scholars consider insect-derived carmine impermissible; plant-based red colours are a halal alternative.",
    aliases: ["carmine", "cochineal", "carminic acid", "e120", "natural red 4", "ci 75470"],
    insNumber: "120",
    alternativeNames: ["Carmine", "Cochineal", "Carminic acid", "Natural Red 4", "CI 75470", "Crimson Lake"],
    fn: "Colour (red / crimson)",
    confidence: "high",
    originType: "insect",
    originSummary: "E120 (Carmine / Cochineal) is a red colour extracted from the dried bodies of cochineal insects, so most scholars treat it as not halal.",
    description: "Carmine is a natural crimson-red colour made from carminic acid, which is extracted from the cochineal insect (Dactylopius coccus). Because its origin is an insect, it is widely classified as doubtful-to-avoid or impermissible by most halal authorities.",
    manufacturingSummary: "Cochineal insects are harvested and dried, and carminic acid is extracted and processed into carmine (an aluminium/calcium lake) or liquid cochineal extract.",
    halalReasoning: "The prohibition here is about origin: carmine is derived from insects, and most scholars consider insect-derived food colour impermissible to consume. This is why we classify it as 'avoid'. Plant-based red colours such as beetroot red (E162), anthocyanins (E163) or lycopene are halal alternatives that manufacturers can use instead.",
    verificationAdvice: "If a product lists carmine, cochineal, carminic acid or 'Natural Red 4', treat it as not halal unless it carries recognised halal certification that specifically covers it. When in doubt, choose a product using a plant-based red colour.",
    commonUses: ["Yoghurts and dairy desserts", "Sweets and confectionery", "Some processed meats and surimi", "Beverages and juices", "Cosmetics and lipsticks (non-food)"],
    labelNames: ["Carmine", "Cochineal", "Carminic acid", "E120", "Natural Red 4", "CI 75470"],
    singaporeGuidance: "In Singapore, verify the product on the MUIS HalalSG register. A product containing carmine would not be expected to hold halal certification unless a specifically-approved colourant is used; contact the manufacturer if the red colour source is unclear.",
    faqs: [
      { q: "Is E120 / carmine halal or haram?", a: "Carmine (E120) is made from insects, and most scholars consider it impermissible, so it is best avoided." },
      { q: "Is carmine made from animals?", a: "It is made from insects (cochineal), not from plants. That insect origin is the reason it is widely treated as not halal." },
      { q: "What is a halal alternative to carmine?", a: "Plant-based red colours such as beetroot red (E162), anthocyanins (E163) or lycopene." },
      { q: "What names should I look for on a label?", a: "'Carmine', 'Cochineal', 'Carminic acid', 'E120', 'Natural Red 4' or 'CI 75470'." },
    ],
    relatedCodes: ["E162", "E163", "E124", "E129"],
    sources: [
      efsaTopic("Scientific opinion on cochineal, carminic acid, carmines (E 120)", "Insect origin of the colour"),
      codexGsfa("INS 120 and approved uses"),
      muisSource("Verify the finished product; carmine-containing products are generally not expected to be certified"),
    ],
    lastReviewed: REVIEWED,
  },

  {
    code: "E122", name: "Azorubine / Carmoisine", category: "Colour", status: "halal",
    origin: "Synthetic azo dye.", aliases: ["azorubine", "carmoisine", "e122", "ci 14720"],
    insNumber: "122",
    alternativeNames: ["Carmoisine", "Azorubine", "CI Food Red 3", "CI 14720"],
    fn: "Colour (red)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E122 (Azorubine / Carmoisine) is a synthetic red azo dye with no animal origin, so it is generally treated as halal at the ingredient level.",
    description: "Azorubine, also called Carmoisine, is a synthetic red colouring from the azo-dye family. Despite giving a similar red to carmine, it is fully synthetic and — unlike carmine (E120) — is not made from insects.",
    manufacturingSummary: "Manufactured by chemical synthesis from sulphonated aromatic compounds; no animal-derived raw materials in the standard process.",
    halalReasoning: "Because it is synthesised from non-animal chemical feedstocks, E122 has no prohibited component in the colour itself and is generally classified as halal at the ingredient level. As always, the finished product needs its own verification.",
    verificationAdvice: "Do not confuse E122 (synthetic, generally halal) with E120 (insect-derived, avoid). Check the whole product and its certification.",
    commonUses: ["Sweets and jellies", "Marzipan and confectionery", "Soft drinks", "Desserts and sauces"],
    labelNames: ["Carmoisine", "Azorubine", "E122", "Colour (E122)", "CI Food Red 3"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    regulatorySummary: "Permitted as a food colour in the EU and UK within limits; subject to the same 'Southampton colours' advisory warning label in the EU/UK. Not permitted in some other markets.",
    faqs: [
      { q: "Is E122 (Carmoisine) halal?", a: "It is a synthetic red dye with no animal origin, so it is generally considered halal at the ingredient level. The finished product still needs verification." },
      { q: "Is Carmoisine the same as carmine (E120)?", a: "No. Carmoisine (E122) is synthetic; carmine (E120) is made from insects. They are easy to confuse because both are red." },
      { q: "What names should I look for?", a: "'Carmoisine', 'Azorubine', 'E122' or 'CI Food Red 3'." },
    ],
    relatedCodes: ["E120", "E124", "E129", "E102"],
    sources: [efsaTopic("Re-evaluation of Azorubine/Carmoisine (E 122) as a food additive", "Synthetic origin and safety re-evaluation"), euAnnexV, codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E124", name: "Ponceau 4R", category: "Colour", status: "halal",
    origin: "Synthetic azo dye.",
    aliases: ["ponceau 4r", "e124", "cochineal red a", "ci 16255"],
    insNumber: "124",
    alternativeNames: ["Ponceau 4R", "Cochineal Red A", "New Coccine", "CI Food Red 7", "CI 16255"],
    fn: "Colour (red)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E124 (Ponceau 4R) is a synthetic red azo dye with no animal origin, so it is generally treated as halal at the ingredient level.",
    description: "Ponceau 4R is a synthetic red colouring from the azo-dye family. Despite the older name 'Cochineal Red A', it is not made from cochineal insects — it is fully manufactured, unlike carmine (E120).",
    manufacturingSummary: "Made by chemical synthesis from sulphonated aromatic compounds; the standard process uses no animal-derived raw materials.",
    halalReasoning: "Because Ponceau 4R is synthesised from non-animal chemical feedstocks, the colour itself contains no prohibited animal or alcohol component and is generally classified as halal at the ingredient level. Do not confuse it with carmine (E120), which is insect-derived. The finished product still needs its own verification.",
    verificationAdvice: "The name 'Cochineal Red A' can mislead — E124 is synthetic and unrelated to insect cochineal (E120). Verify the whole product and its certification.",
    commonUses: ["Sweets and jellies", "Soft drinks", "Dessert mixes and sauces", "Some processed meats and seafood dressings"],
    labelNames: ["Ponceau 4R", "E124", "Colour (E124)", "Cochineal Red A", "CI Food Red 7"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    regulatorySummary: "Permitted as a food colour in the EU and UK within limits; subject to the same 'Southampton colours' advisory warning label in the EU/UK. It is not authorised as a food colour in the United States.",
    faqs: [
      { q: "Is E124 (Ponceau 4R) halal?", a: "It is a synthetic red dye with no animal origin, so it is generally considered halal at the ingredient level. The finished product still needs verification." },
      { q: "Is Ponceau 4R made from insects?", a: "No. Despite the old name 'Cochineal Red A', it is fully synthetic — unlike carmine (E120), which is insect-derived." },
      { q: "What names should I look for?", a: "'Ponceau 4R', 'E124', 'Cochineal Red A' or 'CI Food Red 7'." },
    ],
    relatedCodes: ["E120", "E122", "E129", "E127"],
    sources: [efsaTopic("Re-evaluation of Ponceau 4R (E 124) as a food additive", "Synthetic origin and safety re-evaluation"), euAnnexV, codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  {
    code: "E127", name: "Erythrosine", category: "Colour", status: "halal",
    origin: "Synthetic dye.",
    aliases: ["erythrosine", "e127", "red 3", "fd&c red 3", "ci 45430"],
    insNumber: "127",
    alternativeNames: ["Erythrosine", "Red 3", "FD&C Red No. 3", "CI Food Red 14", "CI 45430"],
    fn: "Colour (cherry-pink / red)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E127 (Erythrosine) is a synthetic cherry-pink dye with no animal origin, so it is generally treated as halal at the ingredient level.",
    description: "Erythrosine is a synthetic cherry-pink to red colouring (an iodine-containing xanthene dye). It is manufactured industrially and has no plant, animal or insect source.",
    manufacturingSummary: "Made by chemical synthesis (iodination of fluorescein). No animal-derived raw materials in the standard process.",
    halalReasoning: "As a fully synthetic colour with no animal or alcohol component, E127 is generally classified as halal at the ingredient level. The finished product still requires its own verification.",
    verificationAdvice: "Erythrosine is a synthetic colour; still confirm the whole product and its certification for a finished item.",
    commonUses: ["Candied and cocktail cherries", "Some sweets and cake decorations", "Certain medicines and supplements"],
    labelNames: ["Erythrosine", "E127", "Colour (E127)", "Red 3", "FD&C Red No. 3"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    healthSummary: "Halal does not automatically mean healthy, and a health concern does not automatically make an ingredient haram. Erythrosine (Red 3) has been the subject of safety reviews; regulatory limits and restrictions on it are a food-safety matter, separate from halal status.",
    regulatorySummary: "In the EU/UK its food use is largely restricted to certain cocktail and candied cherries. In the United States, the FDA acted in 2025 to revoke the authorisation of Red No. 3 (erythrosine) for use in food. These are safety-based decisions, separate from halal status.",
    faqs: [
      { q: "Is E127 (Erythrosine) halal?", a: "It is a synthetic dye with no animal origin, so it is generally considered halal at the ingredient level. The finished product still needs verification." },
      { q: "Is erythrosine banned?", a: "Its food use is restricted in the EU/UK (mainly to certain cherries), and in 2025 the US FDA moved to revoke Red No. 3 for food use. Any such restriction is a safety matter, separate from halal status." },
      { q: "What names should I look for?", a: "'Erythrosine', 'E127', 'Red 3' or 'FD&C Red No. 3'." },
    ],
    relatedCodes: ["E120", "E124", "E129", "E122"],
    sources: [
      efsaTopic("Re-evaluation of Erythrosine (E 127) as a food additive", "Synthetic origin and safety re-evaluation"),
      { title: "Color Additives — regulatory status (incl. FD&C Red No. 3)", organisation: "U.S. Food and Drug Administration (FDA)", url: "https://www.fda.gov/industry/color-additives", sourceType: "regulatory", accessedDate: REVIEWED, supports: "US regulatory status of erythrosine (Red 3) — a safety decision, separate from halal" },
      codexGsfa(),
      muisSource(),
    ],
    lastReviewed: REVIEWED,
  },

  {
    code: "E129", name: "Allura Red AC", category: "Colour", status: "halal",
    origin: "Synthetic azo dye.", aliases: ["red 40", "allura red", "fd&c red 40", "e129", "ci 16035"],
    insNumber: "129",
    alternativeNames: ["Red 40", "FD&C Red No. 40", "CI Food Red 17", "CI 16035"],
    fn: "Colour (red)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E129 (Allura Red AC) is a synthetic red azo dye with no animal origin, so it is generally treated as halal at the ingredient level.",
    description: "Allura Red AC, widely known in the US as Red 40, is a synthetic red colouring from the azo-dye family. It is manufactured industrially and is not derived from insects or any animal — a common point of confusion with carmine (E120).",
    manufacturingSummary: "Produced by chemical synthesis from sulphonated aromatic compounds; historically petroleum-derived. No animal materials in the standard process.",
    halalReasoning: "As a fully synthetic colour with no animal or alcohol component, E129 is generally classified as halal at the ingredient level. The finished product still requires its own verification.",
    verificationAdvice: "Do not confuse E129 (synthetic, generally halal) with carmine (E120, insect-derived). Verify the whole product and its certification.",
    commonUses: ["Soft drinks and sports drinks", "Sweets and confectionery", "Snacks and cereals", "Desserts and sauces"],
    labelNames: ["Allura Red AC", "E129", "Colour (E129)", "Red 40", "FD&C Red No. 40"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    regulatorySummary: "Permitted as a food colour in the EU, UK and US within limits; subject to the same 'Southampton colours' advisory warning label in the EU/UK.",
    faqs: [
      { q: "Is E129 (Allura Red / Red 40) halal?", a: "It is a synthetic dye with no animal origin, so it is generally considered halal at the ingredient level. The finished product still needs verification." },
      { q: "Is Red 40 made from insects?", a: "No — that is carmine (E120). Allura Red (E129) is fully synthetic." },
      { q: "What names should I look for?", a: "'Allura Red AC', 'E129', 'Red 40' or 'FD&C Red No. 40'." },
    ],
    relatedCodes: ["E120", "E124", "E122", "E102"],
    sources: [efsaTopic("Re-evaluation of Allura Red AC (E 129) as a food additive", "Synthetic origin and safety re-evaluation"), euAnnexV, codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E132", name: "Indigo Carmine", category: "Colour", status: "halal",
    origin: "Synthetic dye (despite the name, not from insects).",
    aliases: ["indigo carmine", "indigotine", "e132", "blue 2", "fd&c blue 2", "ci 73015"],
    insNumber: "132",
    alternativeNames: ["Indigotine", "Indigo Carmine", "Blue 2", "FD&C Blue No. 2", "CI Food Blue 1", "CI 73015"],
    fn: "Colour (blue)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E132 (Indigo Carmine / Indigotine) is a synthetic blue dye — despite the name 'carmine' it is not made from insects — so it is generally treated as halal at the ingredient level.",
    description: "Indigo Carmine, also called Indigotine, is a synthetic blue colouring. The word 'carmine' in its name causes confusion, but unlike carmine E120 it is not derived from insects — it is manufactured chemically.",
    manufacturingSummary: "Made by chemical synthesis (sulfonation of synthetic indigo). No animal-derived raw materials in the standard process.",
    halalReasoning: "Indigo Carmine is generally classified as halal at the ingredient level because it is fully synthetic, with no animal or alcohol component — the 'carmine' in the name refers to the colour, not to insect cochineal (E120). The finished product still requires its own verification.",
    verificationAdvice: "Do not confuse E132 (synthetic blue, generally halal) with carmine E120 (insect-derived red). Verify the whole product and its certification.",
    commonUses: ["Sweets and ice cream", "Soft drinks", "Baked goods and decorations", "Some medicines (and as a diagnostic dye)"],
    labelNames: ["Indigo Carmine", "Indigotine", "E132", "Colour (E132)", "Blue 2", "FD&C Blue No. 2"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    faqs: [
      { q: "Is E132 (Indigo Carmine) halal?", a: "Yes — it is a synthetic dye with no animal origin, so it is generally considered halal at the ingredient level. The finished product still needs verification." },
      { q: "Is Indigo Carmine made from insects?", a: "No. Despite 'carmine' in the name, it is synthetic — unlike carmine (E120), which is insect-derived." },
      { q: "What names should I look for?", a: "'Indigo Carmine', 'Indigotine', 'E132', 'Blue 2' or 'FD&C Blue No. 2'." },
    ],
    relatedCodes: ["E120", "E124", "E129", "E122"],
    sources: [efsaTopic("Re-evaluation of Indigo Carmine (E 132) as a food additive", "Synthetic origin and safety re-evaluation"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E140", name: "Chlorophyll", category: "Colour", status: "halal", origin: "Green colour from plants." },
  {
    code: "E150", name: "Caramel colour", category: "Colour", status: "mushbooh",
    origin: "Made by heating sugars; usually halal, but some processes may use trace alcohol or ammonia.",
    note: "Plain caramel (E150a) is generally halal; verify if avoiding all alcohol traces.",
    aliases: ["caramel colour", "caramel color", "e150", "e150a", "e150c", "e150d", "caramel"],
    insNumber: "150",
    alternativeNames: ["Caramel colour", "Plain caramel (E150a)", "Caustic sulphite caramel (E150b)", "Ammonia caramel (E150c)", "Sulphite ammonia caramel (E150d)"],
    fn: "Colour (brown)",
    confidence: "medium",
    originType: "variable",
    originSummary: "E150 (Caramel colour) is a brown colour made by heating sugars; it is usually halal, but is treated as doubtful because some processes use ammonia or other reactants and a few may involve trace alcohol.",
    description: "Caramel colour is a brown food colouring made by controlled heating of sugars. It comes in four classes (E150a–d) that differ in the reactants used — plain (E150a), caustic-sulphite (E150b), ammonia (E150c) and sulphite-ammonia (E150d).",
    manufacturingSummary: "Sugars (such as glucose) are heated, sometimes with acids, alkalis or salts (including ammonium or sulphite compounds depending on the class). Plain caramel (E150a) uses no ammonia or sulphite.",
    halalReasoning: "Caramel colour is generally considered halal, since it is made from sugar. It is treated as doubtful mainly as a caution: some manufacturing involves reactants, and a small number of processes may involve trace alcohol as a solvent. Plain caramel (E150a) is the most straightforward; for strict avoidance of any alcohol trace, verify the class and process.",
    verificationAdvice: "Where it matters to you, look for halal certification or ask the manufacturer which caramel class is used and whether any alcohol is involved.",
    commonUses: ["Colas and soft drinks", "Sauces (e.g. soy sauce, gravy)", "Baked goods and confectionery", "Some vinegars and marinades"],
    labelNames: ["Caramel colour", "E150", "E150a", "E150c", "E150d", "Colour (caramel)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer if you need to confirm the caramel class or process.",
    faqs: [
      { q: "Is E150 (caramel colour) halal?", a: "It is generally considered halal, as it is made from sugar. It is treated as doubtful mainly as a caution about reactants and possible trace alcohol in some processes — plain caramel (E150a) is the most straightforward." },
      { q: "Is caramel colour made from alcohol?", a: "No, it is made from sugar. A small number of processes may involve trace alcohol as a solvent; verify the class/process if you avoid all traces." },
      { q: "What names should I look for?", a: "'Caramel colour', 'E150' or the specific class 'E150a'–'E150d'." },
    ],
    relatedCodes: ["E100", "E160a", "E153"],
    sources: [efsaTopic("Re-evaluation of caramel colours (E 150a-d) as food additives", "Manufacturing classes and reactants"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  {
    code: "E153", name: "Vegetable carbon", category: "Colour", status: "mushbooh",
    origin: "Black colour from charred plant matter — but 'carbon black' can also be animal bone char.",
    note: "Confirm it is vegetable-sourced, not bone char.",
    aliases: ["vegetable carbon", "carbon black", "e153", "carbo vegetabilis"],
    insNumber: "153",
    alternativeNames: ["Vegetable carbon", "Carbo medicinalis vegetabilis", "Carbon black (food grade)"],
    fn: "Colour (black)",
    confidence: "medium",
    originType: "variable",
    originSummary: "E153 (Vegetable carbon) is a black colour from charred plant matter and is halal when plant-sourced — but because 'carbon black' can also be made from animal bone char, it is treated as doubtful unless confirmed vegetable.",
    description: "Vegetable carbon is a black food colouring made by charring plant material such as wood or coconut shells. As specified in the EU, food-grade E153 is vegetable-derived, but the general term 'carbon black' can also refer to bone char.",
    manufacturingSummary: "Plant material is charred (carbonised) under controlled conditions and purified. The EU specification for E153 is vegetable carbon; some non-EU 'carbon black' may be of different origin.",
    halalReasoning: "When E153 is genuinely vegetable carbon, it is halal (plant-derived). It is treated as doubtful because the wider term 'carbon black' can also be animal bone char, which would only be permissible if from a halal animal. Confirm the product uses vegetable-sourced carbon.",
    verificationAdvice: "Look for 'vegetable carbon' specifically, halal certification, or a vegetarian/vegan claim; otherwise ask the manufacturer whether the black colour is vegetable- or bone-derived.",
    commonUses: ["Black sweets and liquorice", "Coloured icings and decorations", "Some cheeses (rind colour)", "Novelty black foods and drinks"],
    labelNames: ["Vegetable carbon", "E153", "Carbon black", "Colour (E153)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer to confirm the carbon is vegetable-sourced.",
    faqs: [
      { q: "Is E153 (vegetable carbon) halal?", a: "When it is genuinely vegetable carbon it is halal. It is treated as doubtful because 'carbon black' can also mean animal bone char — confirm the source is plant." },
      { q: "Is vegetable carbon from bones?", a: "E153 as specified is from charred plant matter, but the broader term 'carbon black' can be bone char. Verify the specific source." },
      { q: "What names should I look for?", a: "'Vegetable carbon' or 'E153' — ideally stated as vegetable-sourced." },
    ],
    relatedCodes: ["E150", "E100", "E172"],
    sources: [efsaTopic("Re-evaluation of vegetable carbon (E 153) as a food additive", "Vegetable specification vs bone char"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  {
    code: "E160a", name: "Beta-carotene", category: "Colour", status: "mushbooh",
    origin: "Orange colour; the colour itself is plant/synthetic, but it is often stabilised in a gelatine carrier.",
    note: "Gelatine-free (e.g. starch-encapsulated) versions are halal.",
    aliases: ["beta-carotene", "beta carotene", "e160a", "carotene", "provitamin a"],
    insNumber: "160a",
    alternativeNames: ["Beta-carotene", "Carotenes", "Provitamin A"],
    fn: "Colour (yellow-orange)",
    confidence: "medium",
    originType: "variable",
    originSummary: "E160a (Beta-carotene) is a yellow-orange colour that is itself plant or synthetic (halal), but it is often stabilised in a gelatine carrier — so it is treated as doubtful unless the carrier is confirmed gelatine-free.",
    description: "Beta-carotene is a yellow-to-orange colour (and a source of vitamin A) found naturally in carrots and other plants; it is also made synthetically. The colour itself is not the issue — the doubt is that it is frequently formulated with a carrier or coating to make it usable in food, and that carrier is sometimes gelatine.",
    manufacturingSummary: "Extracted from plants/algae or synthesised, then often encapsulated with a carrier (starch, gum or gelatine) to stabilise it. The carrier is not usually stated on the label.",
    halalReasoning: "Beta-carotene as a colour is plant- or synthetically-derived and would be halal, but it is treated as doubtful because it is commonly delivered in a carrier that can be gelatine (of unspecified animal origin). Gelatine-free versions — for example starch- or gum-encapsulated — are halal. Confirm the carrier.",
    verificationAdvice: "Look for halal certification or a vegetarian/vegan claim (which rules out gelatine), or ask the manufacturer whether a gelatine carrier is used.",
    commonUses: ["Margarine and dairy spreads", "Cheese and dairy drinks", "Soft drinks and juices", "Supplements"],
    labelNames: ["Beta-carotene", "Carotenes", "E160a", "Colour (E160a)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer to confirm the carrier is gelatine-free.",
    faqs: [
      { q: "Is E160a (beta-carotene) halal?", a: "The colour itself is plant or synthetic (halal), but it is often carried in gelatine, which is why it is treated as doubtful. Gelatine-free versions are halal — confirm the carrier." },
      { q: "Is beta-carotene from animals?", a: "The colour is from plants or synthesis, not animals. The concern is the carrier used to stabilise it, which can be gelatine." },
      { q: "What names should I look for?", a: "'Beta-carotene', 'Carotenes' or 'E160a' — ideally with a vegetarian/vegan or gelatine-free indication." },
    ],
    relatedCodes: ["E101", "E160b", "E441"],
    sources: [efsaTopic("Re-evaluation of carotenes (E 160a) as a food additive", "Plant/synthetic colour; carrier can vary"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E160b", name: "Annatto", category: "Colour", status: "halal", origin: "Orange colour from annatto seeds — plant-derived." },
  { code: "E160c", name: "Paprika extract", category: "Colour", status: "halal", origin: "From paprika/peppers — plant-derived." },
  { code: "E162", name: "Beetroot Red (Betanin)", category: "Colour", status: "halal", origin: "Red colour from beetroot — plant-derived.", aliases: ["betanin"] },
  { code: "E163", name: "Anthocyanins", category: "Colour", status: "halal", origin: "Purple/red colours from fruits and vegetables." },
  { code: "E170", name: "Calcium carbonate", category: "Colour", status: "halal", origin: "Mineral (chalk)." },
  { code: "E171", name: "Titanium dioxide", category: "Colour", status: "halal", origin: "White mineral pigment.", note: "Banned as a food additive in some countries for safety reasons — that is separate from its halal status." },
  { code: "E172", name: "Iron oxides & hydroxides", category: "Colour", status: "halal", origin: "Mineral pigments." },

  // ── Preservatives ────────────────────────────────────────────────────────
  { code: "E200", name: "Sorbic acid", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
  {
    code: "E202", name: "Potassium sorbate", category: "Preservative", status: "halal",
    origin: "Synthetic preservative.",
    aliases: ["potassium sorbate", "e202"],
    insNumber: "202",
    alternativeNames: ["Potassium sorbate", "Potassium salt of sorbic acid"],
    fn: "Preservative",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E202 (Potassium sorbate) is a synthetically-manufactured preservative with no animal origin, so it is generally considered halal.",
    description: "Potassium sorbate is the potassium salt of sorbic acid, a widely used preservative that stops the growth of mould and yeast in food. It is manufactured synthetically.",
    manufacturingSummary: "Produced by neutralising sorbic acid (made synthetically) with potassium. No animal-derived raw materials.",
    halalReasoning: "Potassium sorbate is a synthetic preservative with no animal or alcohol component, so it is generally classified as halal. As always, the finished product still needs its own verification.",
    verificationAdvice: "Potassium sorbate itself is halal; still confirm the whole product and its certification for a finished item.",
    commonUses: ["Cheese and dairy products", "Baked goods", "Dried fruit, sauces and pickles", "Soft drinks and syrups"],
    labelNames: ["Potassium sorbate", "E202", "Preservative (E202)"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    faqs: [
      { q: "Is E202 (potassium sorbate) halal?", a: "Yes — it is a synthetic preservative with no animal origin, so it is generally considered halal. The finished product still needs verification." },
      { q: "Is potassium sorbate from animals?", a: "No. It is manufactured synthetically." },
      { q: "What names should I look for?", a: "'Potassium sorbate' or 'E202'." },
    ],
    relatedCodes: ["E200", "E211", "E210"],
    sources: [efsaTopic("Re-evaluation of sorbic acid and sorbates (E 200-203) as food additives", "Synthetic origin"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E210", name: "Benzoic acid", category: "Preservative", status: "halal", origin: "Synthetic/plant preservative." },
  {
    code: "E211", name: "Sodium benzoate", category: "Preservative", status: "halal",
    origin: "Synthetic preservative.",
    aliases: ["sodium benzoate", "e211", "benzoate of soda"],
    insNumber: "211",
    alternativeNames: ["Sodium benzoate", "Sodium salt of benzoic acid"],
    fn: "Preservative",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E211 (Sodium benzoate) is a synthetically-manufactured preservative with no animal origin, so it is generally considered halal.",
    description: "Sodium benzoate is the sodium salt of benzoic acid, a common preservative that inhibits mould, yeast and some bacteria, especially in acidic foods and drinks. It is manufactured synthetically.",
    manufacturingSummary: "Produced by neutralising benzoic acid with sodium hydroxide. No animal-derived raw materials.",
    halalReasoning: "Sodium benzoate is a synthetic preservative with no animal or alcohol component, so it is generally classified as halal. The finished product still needs its own verification.",
    verificationAdvice: "Sodium benzoate itself is halal; still confirm the whole product and its certification for a finished item.",
    commonUses: ["Soft drinks and juices", "Pickles and sauces", "Condiments and dressings", "Some medicines"],
    labelNames: ["Sodium benzoate", "E211", "Preservative (E211)"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    faqs: [
      { q: "Is E211 (sodium benzoate) halal?", a: "Yes — it is a synthetic preservative with no animal origin, so it is generally considered halal. The finished product still needs verification." },
      { q: "Is sodium benzoate from animals?", a: "No. It is manufactured synthetically." },
      { q: "What names should I look for?", a: "'Sodium benzoate' or 'E211'." },
    ],
    relatedCodes: ["E210", "E202", "E200"],
    sources: [efsaTopic("Re-evaluation of benzoic acid and benzoates (E 210-213) as food additives", "Synthetic origin"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E220", name: "Sulphur dioxide", category: "Preservative", status: "halal", origin: "Chemical preservative." },
  { code: "E223", name: "Sodium metabisulphite", category: "Preservative", status: "halal", origin: "Chemical preservative." },

  {
    code: "E250", name: "Sodium nitrite", category: "Preservative", status: "halal",
    origin: "Curing salt (chemical).",
    note: "Halal in itself — but often used to cure meats; the MEAT must be halal.",
    aliases: ["sodium nitrite", "e250", "curing salt", "ins 250"],
    insNumber: "250",
    alternativeNames: ["Sodium nitrite", "Curing salt (with salt)"],
    fn: "Preservative / curing agent",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E250 (Sodium nitrite) is a manufactured curing salt that is halal in itself — but it is commonly used to cure meats, so the meat it is used on must itself be halal.",
    description: "Sodium nitrite is a chemically-manufactured salt used to preserve and cure meats, fix their pink colour and protect against bacteria such as Clostridium botulinum. The additive itself has no animal origin.",
    manufacturingSummary: "Produced industrially by chemical processes (e.g. reaction of nitrogen oxides with sodium hydroxide/carbonate). No animal-derived raw material.",
    halalReasoning: "The additive on its own is a mineral/chemical salt with no prohibited origin, so it is halal as an ingredient. The important caveat is context: E250 is most often found in cured meats (bacon, ham, sausages, luncheon meat). The additive does not make those meats halal — the meat itself must come from a halal-slaughtered, permissible animal. So a product's halal status depends on the meat, not on the nitrite.",
    verificationAdvice: "For cured-meat products, the decisive question is whether the meat is halal-certified. Check for halal certification on the finished product; a permissible curing salt does not make a non-halal meat acceptable.",
    commonUses: ["Cured and processed meats (as a curing salt)", "Bacon, ham and sausages", "Luncheon meat and hot dogs", "Some smoked fish"],
    labelNames: ["Sodium nitrite", "E250", "Curing salt", "Preservative (E250)"],
    singaporeGuidance: "In Singapore, verify the finished meat product on the MUIS HalalSG register. The presence of E250 tells you nothing about the meat's halal status — always confirm the meat/product certification.",
    healthSummary: "Halal does not automatically mean healthy. Nitrites in cured meats can form nitrosamines under certain conditions, and health authorities advise moderating processed-meat intake; the International Agency for Research on Cancer classifies processed meat as a Group 1 carcinogen. This is a health/safety consideration and is separate from halal status.",
    regulatorySummary: "Permitted as a preservative/curing agent within strict maximum limits in the EU, UK and many other markets, because of its role in preventing botulism.",
    faqs: [
      { q: "Is E250 (sodium nitrite) halal?", a: "The additive itself is a chemical curing salt and is halal. But it is usually used on meat — and the meat must itself be halal for the product to be halal." },
      { q: "Does E250 make cured meat halal?", a: "No. A permissible curing salt does not make a non-halal meat acceptable. The meat must come from a halal source." },
      { q: "Is sodium nitrite made from animals?", a: "No. It is manufactured chemically with no animal-derived raw material." },
      { q: "How do I verify a cured-meat product in Singapore?", a: "Check the finished product on the MUIS HalalSG register or with the manufacturer — the meat's certification is what matters." },
    ],
    relatedCodes: ["E251", "E200", "E202"],
    sources: [
      efsaTopic("Re-evaluation of sodium nitrite (E 250) as a food additive", "Permitted-use status and safety limits"),
      codexGsfa("INS 250 and approved uses"),
      {
        title: "IARC Monographs — Red Meat and Processed Meat (Vol. 114)",
        organisation: "International Agency for Research on Cancer (WHO)",
        url: "https://www.iarc.who.int/",
        sourceType: "scientific",
        accessedDate: REVIEWED,
        supports: "Health context for processed meat (separate from halal status)",
      },
      muisSource("The meat/product certification, not the curing salt, determines halal status"),
    ],
    lastReviewed: REVIEWED,
  },

  { code: "E251", name: "Sodium nitrate", category: "Preservative", status: "halal", origin: "Curing salt (chemical)." },
  {
    code: "E260", name: "Acetic acid", category: "Preservative", status: "mushbooh",
    origin: "Vinegar acid; halal when synthetic or from halal vinegar, but can be derived from wine vinegar.",
    note: "Vinegar from wine is treated as halal by many scholars once fully converted; confirm if strict.",
    aliases: ["acetic acid", "e260", "vinegar acid", "ethanoic acid"],
    insNumber: "260",
    alternativeNames: ["Acetic acid", "Ethanoic acid", "Vinegar acid"],
    fn: "Acidity regulator / preservative",
    confidence: "medium",
    originType: "variable",
    originSummary: "E260 (Acetic acid) is the acid in vinegar; it is halal when synthetic or from halal vinegar, but because it can be made from wine vinegar it is treated by some as doubtful — many scholars accept fully-converted vinegar as halal.",
    description: "Acetic acid is the sour component of vinegar, used as an acidity regulator and preservative. It can be produced synthetically or by fermentation, and the vinegar it comes from can be of various sources — including, in some cases, wine.",
    manufacturingSummary: "Made synthetically or by fermenting alcohol to vinegar. Where it is derived from wine vinegar, the alcohol has been converted to acetic acid.",
    halalReasoning: "Synthetic acetic acid and acetic acid from halal vinegar (e.g. from dates, apples, malt) are halal. The question arises only with wine-derived vinegar: many scholars hold that once wine has fully converted into vinegar it becomes halal, while stricter views prefer to avoid it. Because the source is usually unstated, it is presented as doubtful for those who follow the cautious view.",
    verificationAdvice: "For most products, acetic acid is not a concern; if you follow the stricter view on wine vinegar, look for halal certification or ask the manufacturer about the vinegar source.",
    commonUses: ["Pickles and sauces", "Dressings and condiments", "Bread and bakery", "Marinades"],
    labelNames: ["Acetic acid", "E260", "Ethanoic acid", "Acidity regulator (E260)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer if you need to confirm the vinegar source.",
    faqs: [
      { q: "Is E260 (acetic acid) halal?", a: "Synthetic acetic acid and acetic acid from halal vinegar are halal. Many scholars also accept vinegar fully converted from wine; stricter views avoid it. As the source is usually unstated, it is presented as doubtful for the cautious." },
      { q: "Is vinegar halal?", a: "Vinegar from halal sources (dates, apples, malt) is halal. Most scholars accept vinegar that has fully converted from wine; some prefer to avoid it." },
      { q: "What names should I look for?", a: "'Acetic acid', 'E260' or 'Ethanoic acid'." },
    ],
    relatedCodes: ["E270", "E330", "E1510"],
    sources: [efsaTopic("Acetic acid (E 260) — food additive information", "Synthetic and fermentation sources"), codexGsfa(), muisSource("Vinegar source assessed during certification")],
    lastReviewed: REVIEWED,
  },
  { code: "E270", name: "Lactic acid", category: "Preservative", status: "halal", origin: "Usually made by bacterial fermentation of plant sugars.", note: "Very rarely uses dairy; generally accepted as halal." },
  { code: "E280", name: "Propionic acid", category: "Preservative", status: "halal", origin: "Synthetic preservative." },

  // ── Antioxidants ───────────────────────────────────────────────────────────
  {
    code: "E300", name: "Ascorbic acid (Vitamin C)", category: "Antioxidant", status: "halal",
    origin: "Synthetic/plant vitamin C.",
    aliases: ["vitamin c", "ascorbic acid", "e300", "l-ascorbic acid"],
    insNumber: "300",
    alternativeNames: ["Ascorbic acid", "L-ascorbic acid", "Vitamin C"],
    fn: "Antioxidant / vitamin",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E300 (Ascorbic acid / Vitamin C) is manufactured by fermentation and synthesis from plant sugars, with no animal origin, so it is generally considered halal.",
    description: "Ascorbic acid is vitamin C, used as an antioxidant to prevent browning and preserve freshness, and to fortify foods. Commercial ascorbic acid is produced industrially from glucose (typically corn-derived) through fermentation and chemical steps.",
    manufacturingSummary: "Produced from glucose (usually corn) by a combination of fermentation and synthesis. No animal-derived raw materials in the standard process.",
    halalReasoning: "Ascorbic acid is generally classified as halal because it is manufactured from plant sugars with no animal or alcohol component. A very small number of strict reviewers ask about processing aids; for certainty, look for certification. The finished product still needs its own verification.",
    verificationAdvice: "Ascorbic acid itself is halal; still confirm the whole product and its certification for a finished item.",
    commonUses: ["Fruit juices and drinks", "Cured and processed meats (as an antioxidant)", "Baked goods (flour treatment)", "Supplements and fortified foods"],
    labelNames: ["Ascorbic acid", "Vitamin C", "E300", "Antioxidant (E300)"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    faqs: [
      { q: "Is E300 (ascorbic acid / Vitamin C) halal?", a: "Yes — it is manufactured from plant sugars with no animal origin, so it is generally considered halal. The finished product still needs verification." },
      { q: "Is Vitamin C from animals?", a: "No. Commercial ascorbic acid is made from glucose (usually corn) by fermentation and synthesis." },
      { q: "What names should I look for?", a: "'Ascorbic acid', 'Vitamin C' or 'E300'." },
    ],
    relatedCodes: ["E301", "E304", "E306"],
    sources: [efsaTopic("Re-evaluation of ascorbic acid (E 300) as a food additive", "Plant-sugar fermentation origin"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E301", name: "Sodium ascorbate", category: "Antioxidant", status: "halal", origin: "Salt of Vitamin C." },
  {
    code: "E304", name: "Ascorbyl palmitate", category: "Antioxidant", status: "mushbooh",
    origin: "Vitamin C bonded to palmitic acid — the palmitate can be animal- or plant-derived.",
    note: "Plant-derived versions are halal.",
    aliases: ["ascorbyl palmitate", "e304", "vitamin c ester"],
    insNumber: "304",
    alternativeNames: ["Ascorbyl palmitate", "L-ascorbyl palmitate", "Vitamin C ester"],
    fn: "Antioxidant",
    confidence: "medium",
    originType: "variable",
    originSummary: "E304 (Ascorbyl palmitate) is a fat-soluble form of vitamin C whose palmitic-acid part can be plant- or animal-derived — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Ascorbyl palmitate is a fat-soluble antioxidant made by joining vitamin C (ascorbic acid) to palmitic acid. It protects oils and fats in food from going rancid.",
    manufacturingSummary: "Ascorbic acid is esterified with palmitic acid. The palmitic acid can come from palm or other vegetable oils, or from animal fat — the label rarely says which.",
    halalReasoning: "E304's status depends on the source of its palmitic acid. When that comes from vegetable oil (commonly palm), it is halal; when it comes from animal fat, it is only permissible if the animal was halal. Because the source is usually unstated, it is treated as doubtful until confirmed. Most commercial ascorbyl palmitate uses vegetable-derived palmitic acid, but this should be verified rather than assumed.",
    verificationAdvice: "Look for halal certification or a 'suitable for vegetarians/vegans' claim, or ask the manufacturer whether the palmitic acid is vegetable- or animal-derived.",
    commonUses: ["Vegetable oils and fats", "Baked goods and cereals", "Infant formula and supplements", "Some sauces and snacks"],
    labelNames: ["Ascorbyl palmitate", "E304", "Antioxidant (E304)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. A certified product will have had the palmitic-acid source assessed; for an uncertified product, contact the manufacturer.",
    faqs: [
      { q: "Is E304 (ascorbyl palmitate) halal?", a: "It is source-dependent. If the palmitic acid is from vegetable oil it is halal; if from animal fat it is permissible only if the animal was halal. Since the source is usually unstated, treat it as doubtful and verify." },
      { q: "Is ascorbyl palmitate vegetarian?", a: "It can be — many commercial versions use plant-derived palmitic acid. Look for a 'suitable for vegetarians' claim or halal certification to be sure." },
      { q: "What names should I look for?", a: "'Ascorbyl palmitate' or 'E304'." },
    ],
    relatedCodes: ["E306", "E300", "E471"],
    sources: [efsaTopic("Re-evaluation of ascorbyl palmitate (E 304) as a food additive", "Palmitic-acid source can be plant or animal"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  {
    code: "E306", name: "Tocopherols (Vitamin E)", category: "Antioxidant", status: "mushbooh",
    origin: "Usually extracted from vegetable oils, but the carrier oil source can vary.",
    note: "Most commercial Vitamin E is soy-derived (halal); confirm if strict.",
    aliases: ["vitamin e", "tocopherol", "tocopherols", "e306"],
    insNumber: "306",
    alternativeNames: ["Tocopherols", "Mixed tocopherols", "Vitamin E"],
    fn: "Antioxidant",
    confidence: "medium",
    originType: "variable",
    originSummary: "E306 (Tocopherols / Vitamin E) is an antioxidant usually extracted from vegetable oils; most commercial Vitamin E is soy-derived and halal, but the carrier and source can vary, so it is treated as doubtful unless confirmed.",
    description: "Tocopherols are a group of compounds that make up vitamin E, used as antioxidants to stop fats and oils going rancid. Food-grade E306 is normally extracted from vegetable oils such as soybean, sunflower or palm.",
    manufacturingSummary: "Recovered from vegetable-oil processing (deodoriser distillates) and concentrated. The tocopherols themselves are plant-derived, though any carrier oil used to dilute them can vary.",
    halalReasoning: "Tocopherols are generally from vegetable oils, which points to halal, but they are classed as doubtful because the carrier oil used with them (and, rarely, the wider process) can vary and is seldom stated. The great majority of commercial Vitamin E is soy- or sunflower-derived and halal; for certainty, look for certification.",
    verificationAdvice: "Look for halal certification or a 'plant-based / suitable for vegetarians' claim, or ask the manufacturer about the source and any carrier oil.",
    commonUses: ["Vegetable oils and margarine", "Baked goods and snacks", "Supplements and infant formula", "Meat products (as an antioxidant)"],
    labelNames: ["Tocopherols", "Mixed tocopherols", "E306", "Vitamin E", "Antioxidant (E306)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer if the source or carrier is unclear.",
    faqs: [
      { q: "Is E306 (Vitamin E / tocopherols) halal?", a: "It is usually extracted from vegetable oils (commonly soy), which is halal, but because the carrier and source can vary and are rarely stated, it is treated as doubtful until confirmed." },
      { q: "Is Vitamin E from animals?", a: "Food-grade E306 is normally plant-derived (from vegetable oils). Synthetic and plant forms are common; confirm if you need certainty." },
      { q: "What names should I look for?", a: "'Tocopherols', 'Mixed tocopherols', 'E306' or 'Vitamin E'." },
    ],
    relatedCodes: ["E304", "E300", "E471"],
    sources: [efsaTopic("Re-evaluation of tocopherols (E 306-309) as food additives", "Vegetable-oil origin and uses"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E322", name: "Lecithin", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Emulsifier usually from soybeans (halal), but can be from egg yolk.",
    note: "Soy lecithin is halal; egg lecithin is halal only if the egg is; sunflower lecithin is halal.",
    aliases: ["soy lecithin", "soya lecithin", "sunflower lecithin", "e322", "lecithin"],
    insNumber: "322",
    alternativeNames: ["Soy lecithin", "Soya lecithin", "Sunflower lecithin", "Egg lecithin"],
    fn: "Emulsifier",
    confidence: "medium",
    originType: "variable",
    originSummary: "E322 (Lecithin) is an emulsifier that is source-dependent: soy and sunflower lecithin are halal, while egg lecithin is halal only if the egg source is acceptable — so it is treated as doubtful unless the source is known.",
    description: "Lecithin is a fatty emulsifier that helps oil and water mix — for example, keeping chocolate smooth. Most commercial lecithin is extracted from soybeans or sunflower seeds (both plant-based and halal), but it can also be obtained from egg yolk.",
    manufacturingSummary: "Commonly extracted from soybean or sunflower oil during degumming; egg-derived lecithin is separated from egg yolk. The plant routes dominate the food supply.",
    halalReasoning: "Lecithin's permissibility depends on its source. Soy lecithin and sunflower lecithin are plant-derived and halal. Egg lecithin is permissible only if the egg itself is acceptable. Because a label often just says 'lecithin' or 'E322' without naming the source, it is treated as doubtful (mushbooh) until the source is confirmed. In practice, the vast majority of food lecithin is soy or sunflower.",
    verificationAdvice: "Look for 'soy lecithin' or 'sunflower lecithin' on the label — both are halal. If it only says 'lecithin'/'E322' and you want certainty, check for halal certification or ask the manufacturer whether it is plant- or egg-derived.",
    commonUses: ["Chocolate and confectionery", "Margarine and spreads", "Baked goods", "Instant powders and drink mixes", "Ice cream"],
    labelNames: ["Lecithin", "Soy lecithin", "Soya lecithin", "Sunflower lecithin", "E322", "Emulsifier (E322)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. A certified product will have had its lecithin source assessed; for an uncertified product, contact the manufacturer if only 'lecithin' is listed.",
    faqs: [
      { q: "Is E322 (lecithin) halal?", a: "It is source-dependent. Soy and sunflower lecithin are halal; egg lecithin is halal only if the egg is acceptable. If the source is not stated, it is treated as doubtful." },
      { q: "Is soy lecithin halal?", a: "Yes. Soy lecithin is plant-derived and halal." },
      { q: "Is lecithin made from pork?", a: "No — lecithin is not derived from pork. Commercial lecithin is mostly from soybeans or sunflower, sometimes from egg yolk." },
      { q: "What names should I look for on a label?", a: "'Soy lecithin' or 'sunflower lecithin' (both halal). If it only says 'lecithin' or 'E322', verify the source." },
    ],
    relatedCodes: ["E471", "E472e", "E475"],
    sources: [
      efsaTopic("Re-evaluation of lecithins (E 322) as a food additive", "Typical plant (soy/sunflower) sourcing and uses"),
      codexGsfa("INS 322 and approved uses"),
      muisSource("Source of lecithin is assessed during product certification"),
    ],
    lastReviewed: REVIEWED,
  },

  { code: "E325", name: "Sodium lactate", category: "Acidity regulator", status: "halal", origin: "Salt of lactic acid (usually plant-fermented)." },

  // ── Acidity regulators ─────────────────────────────────────────────────────
  {
    code: "E330", name: "Citric acid", category: "Acidity regulator", status: "halal",
    origin: "Made by fermentation of sugars — plant-based.",
    aliases: ["sour salt", "citric acid", "e330"],
    insNumber: "330",
    alternativeNames: ["Citric acid", "Sour salt", "2-hydroxypropane-1,2,3-tricarboxylic acid"],
    fn: "Acidity regulator / antioxidant",
    confidence: "high",
    originType: "microbial",
    originSummary: "E330 (Citric acid) is produced by microbial fermentation of plant sugars and is generally considered halal; a strict check would confirm the fermentation medium.",
    description: "Citric acid is a sour-tasting acid used to adjust acidity, add tartness and preserve freshness. Although it occurs naturally in citrus fruit, commercial citric acid is made by fermenting sugars with the mould Aspergillus niger.",
    manufacturingSummary: "Produced by fermenting a carbohydrate (often corn/glucose) with the mould Aspergillus niger, then purified. The process is plant- and microbe-based.",
    halalReasoning: "Citric acid is generally classified as halal because it is produced by microbial fermentation of plant sugars, with no animal or alcohol component. A small number of strict bodies ask about the fermentation medium and processing aids; for full certainty, look for certification. The finished product still needs its own verification.",
    verificationAdvice: "Citric acid is generally halal; if you follow a strict standard, choose a halal-certified product or ask the manufacturer about the fermentation substrate.",
    commonUses: ["Soft drinks and cordials", "Sweets and jams", "Sauces and canned foods", "Supplements and effervescent tablets"],
    labelNames: ["Citric acid", "E330", "Sour salt", "Acidity regulator (E330)"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    faqs: [
      { q: "Is E330 (citric acid) halal?", a: "Yes — it is made by microbial fermentation of plant sugars and is generally considered halal. A strict check would confirm the fermentation medium." },
      { q: "Is citric acid made from animals?", a: "No. Commercial citric acid is produced by fermenting plant sugars with a mould (Aspergillus niger)." },
      { q: "Is citric acid from citrus fruit?", a: "It occurs naturally in citrus, but commercial E330 is made by fermentation of sugars, not extracted from fruit." },
      { q: "What names should I look for?", a: "'Citric acid', 'E330' or 'Sour salt'." },
    ],
    relatedCodes: ["E331", "E333", "E270"],
    sources: [efsaTopic("Citric acid (E 330) — food additive information", "Fermentation origin and uses"), codexGsfa(), muisSource("Fermentation medium assessed during certification")],
    lastReviewed: REVIEWED,
  },
  { code: "E331", name: "Sodium citrate", category: "Acidity regulator", status: "halal", origin: "Salt of citric acid." },
  { code: "E333", name: "Calcium citrate", category: "Acidity regulator", status: "halal", origin: "Salt of citric acid." },
  { code: "E338", name: "Phosphoric acid", category: "Acidity regulator", status: "halal", origin: "Mineral acid." },
  { code: "E339", name: "Sodium phosphates", category: "Acidity regulator", status: "halal", origin: "Mineral salts." },
  { code: "E341", name: "Calcium phosphate", category: "Acidity regulator", status: "halal", origin: "Mineral salt.", note: "Distinct from E542 (bone phosphate), which is animal-derived." },

  // ── Thickeners, emulsifiers & stabilisers ──────────────────────────────────
  { code: "E400", name: "Alginic acid", category: "Thickener", status: "halal", origin: "From brown seaweed." },
  { code: "E406", name: "Agar", category: "Thickener", status: "halal", origin: "Gelling agent from seaweed — a common halal alternative to gelatine.", aliases: ["agar agar"] },

  {
    code: "E407", name: "Carrageenan", category: "Thickener", status: "halal",
    origin: "From red seaweed.",
    aliases: ["carrageenan", "e407", "irish moss", "ins 407"],
    insNumber: "407",
    alternativeNames: ["Carrageenan", "Irish moss extract"],
    fn: "Thickener / gelling agent / stabiliser",
    confidence: "high",
    originType: "plant",
    originSummary: "E407 (Carrageenan) is a gelling and thickening agent extracted from red seaweed — a plant source — so it is generally considered halal.",
    description: "Carrageenan is a family of carbohydrates extracted from certain red seaweeds. It is used to thicken, gel and stabilise foods, and is one of the common plant-based alternatives to gelatine for texture.",
    manufacturingSummary: "Extracted from red seaweed (e.g. Kappaphycus, Eucheuma, Chondrus) by alkaline treatment, then filtered and dried. No animal-derived material.",
    halalReasoning: "Because carrageenan comes from seaweed and no animal-derived processing material is normally involved, it is generally classified as halal. As always, the finished product still needs its own verification.",
    verificationAdvice: "Carrageenan itself is a halal, plant-based ingredient. For a finished product, still confirm the whole ingredient list and any halal certification.",
    commonUses: ["Dairy and plant-based milks", "Ice cream and desserts", "Jellies and processed meats (as a binder)", "Sauces and dressings"],
    labelNames: ["Carrageenan", "E407", "Thickener (E407)", "Irish moss"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    healthSummary: "Halal does not automatically mean healthy. Carrageenan is a permitted food additive; some debate exists about digestive effects of certain forms, which is a food-safety topic evaluated by regulators and separate from halal status.",
    faqs: [
      { q: "Is E407 (carrageenan) halal?", a: "Yes — it is extracted from red seaweed, a plant source, so it is generally considered halal. The finished product still needs its own verification." },
      { q: "Is carrageenan the same as gelatine?", a: "No. Gelatine is animal-derived; carrageenan is a plant (seaweed) gelling agent and is often used as a halal alternative." },
      { q: "What names should I look for?", a: "'Carrageenan', 'E407' or 'Irish moss'." },
    ],
    relatedCodes: ["E406", "E440", "E415", "E410", "E412"],
    sources: [
      efsaTopic("Re-evaluation of carrageenan (E 407) as a food additive", "Seaweed (plant) origin and uses"),
      codexGsfa("INS 407 and approved uses"),
      muisSource(),
    ],
    lastReviewed: REVIEWED,
  },

  { code: "E410", name: "Locust bean gum", category: "Thickener", status: "halal", origin: "From carob seeds — plant.", aliases: ["carob gum"] },
  { code: "E412", name: "Guar gum", category: "Thickener", status: "halal", origin: "From guar beans — plant." },
  { code: "E414", name: "Gum arabic (Acacia gum)", category: "Thickener", status: "halal", origin: "From acacia tree sap — plant.", aliases: ["acacia gum"] },

  {
    code: "E415", name: "Xanthan gum", category: "Thickener", status: "halal",
    origin: "Made by fermentation of sugars.",
    aliases: ["xanthan gum", "xanthan", "e415", "ins 415"],
    insNumber: "415",
    alternativeNames: ["Xanthan gum"],
    fn: "Thickener / stabiliser",
    confidence: "medium",
    originType: "microbial",
    originSummary: "E415 (Xanthan gum) is made by microbial fermentation of sugars and is generally considered halal; a strict check would confirm the fermentation medium.",
    description: "Xanthan gum is a thickening and stabilising agent produced by fermenting sugars with the bacterium Xanthomonas campestris. It is widely used to thicken sauces and to improve texture in gluten-free baking.",
    manufacturingSummary: "Produced by bacterial fermentation of a carbohydrate (often from corn/glucose), then recovered, dried and milled. The organism is a microbe, not an animal.",
    halalReasoning: "Xanthan gum is generally classified as halal because it is produced by microbial fermentation and is not animal-derived. A small number of strict reviewers ask about the fermentation medium and any processing aids; for full certainty, look for halal certification. The sugar substrate is typically plant-based.",
    verificationAdvice: "Xanthan gum is generally halal. If you follow a strict standard, choose a halal-certified product or ask the manufacturer about the fermentation substrate and processing aids.",
    commonUses: ["Sauces, dressings and gravies", "Gluten-free baked goods", "Dairy and plant-based products", "Instant mixes"],
    labelNames: ["Xanthan gum", "E415", "Thickener (E415)"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    faqs: [
      { q: "Is E415 (xanthan gum) halal?", a: "Yes — it is generally considered halal, as it is made by microbial fermentation and is not animal-derived. A strict check would confirm the fermentation medium." },
      { q: "Is xanthan gum made from animals?", a: "No. It is produced by bacterial fermentation of sugars." },
      { q: "What names should I look for?", a: "'Xanthan gum' or 'E415'." },
    ],
    relatedCodes: ["E412", "E410", "E407", "E466", "E440"],
    sources: [
      efsaTopic("Re-evaluation of xanthan gum (E 415) as a food additive", "Microbial fermentation origin and uses"),
      codexGsfa("INS 415 and approved uses"),
      muisSource("Fermentation medium and processing aids assessed during certification"),
    ],
    lastReviewed: REVIEWED,
  },

  { code: "E440", name: "Pectin", category: "Thickener", status: "halal", origin: "From fruit — plant-based gelling agent." },
  { code: "E420", name: "Sorbitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol, usually from corn/glucose." },
  { code: "E421", name: "Mannitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol." },
  {
    code: "E422", name: "Glycerol / Glycerine", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Can be from plant oils, synthetic, or animal fat.",
    note: "Plant/synthetic glycerine is halal; animal-fat glycerine is not unless from halal animals.",
    aliases: ["glycerin", "glycerine", "glycerol", "e422"],
    insNumber: "422",
    alternativeNames: ["Glycerol", "Glycerine", "Glycerin"],
    fn: "Humectant / emulsifier / sweetener",
    confidence: "medium",
    originType: "variable",
    originSummary: "E422 (Glycerol / Glycerine) can be made from plant oils, from petrochemical synthesis, or from animal fat — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Glycerol (glycerine) is a sweet, syrupy liquid used to keep foods moist, as a solvent, and as an emulsifier. It is also common in medicines, toothpaste and cosmetics. It can come from vegetable oils, from synthesis, or from animal fats.",
    manufacturingSummary: "Produced as a by-product of soap-making and biodiesel from fats/oils, or by synthesis. The fat/oil feedstock can be vegetable (e.g. palm, soy) or animal (tallow) — the label rarely says.",
    halalReasoning: "Glycerol's status depends on its source. Plant-derived and synthetic glycerine are halal; animal-fat glycerine is only permissible if the animal was halal. Because the source is usually unstated, it is treated as doubtful until confirmed. Much food and pharmaceutical glycerine is vegetable-derived, but this should be verified.",
    verificationAdvice: "Look for 'vegetable glycerine', halal certification, or a 'suitable for vegetarians/vegans' claim; otherwise ask the manufacturer whether the glycerol is plant-, synthetic- or animal-derived.",
    commonUses: ["Icings, fondants and cake decorations", "Low-moisture and 'soft' baked goods", "Confectionery and cereal bars", "Medicines, toothpaste and cosmetics"],
    labelNames: ["Glycerol", "Glycerine", "Glycerin", "E422", "Humectant (E422)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. A certified product will have had the glycerol source assessed; for an uncertified product, contact the manufacturer.",
    faqs: [
      { q: "Is E422 (glycerol / glycerine) halal?", a: "It is source-dependent. Plant-derived and synthetic glycerine are halal; animal-fat glycerine is permissible only if from a halal animal. Since the source is usually unstated, treat it as doubtful and verify." },
      { q: "Is glycerine made from pork?", a: "It can be made from animal fat, which could include pork-derived tallow, but it is also commonly vegetable-derived or synthetic. Look for 'vegetable glycerine' or certification, or ask the manufacturer." },
      { q: "Is vegetable glycerine halal?", a: "Yes. Vegetable-derived glycerine is halal." },
      { q: "What names should I look for?", a: "'Glycerol', 'Glycerine', 'Glycerin' or 'E422' — ideally 'vegetable glycerine'." },
    ],
    relatedCodes: ["E471", "E475", "E570", "E572"],
    sources: [efsaTopic("Re-evaluation of glycerol (E 422) as a food additive", "Source can be vegetable, synthetic or animal fat"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E441", name: "Gelatine", category: "Emulsifier & stabiliser", status: "haram",
    origin: "Made from animal skin/bone — commonly pork or non-halal beef.",
    note: "Halal-certified gelatine (from halal-slaughtered cattle) and plant substitutes (agar, pectin, carrageenan) exist.",
    aliases: ["gelatin", "gelatine", "e441", "ins 441"],
    insNumber: "441",
    alternativeNames: ["Gelatin", "Gelatine", "Beef gelatine", "Pork gelatine", "Fish gelatine"],
    fn: "Gelling agent / stabiliser",
    confidence: "high",
    originType: "animal",
    originSummary: "E441 (Gelatine) is made from animal skin and bones — commonly pork or non-halal beef — so standard gelatine is treated as not halal unless it is specifically halal-certified.",
    description: "Gelatine is a gelling protein extracted from the skin, bones and connective tissue of animals. It gives the wobble to jelly, gummy sweets, marshmallows and many desserts, and is also used in some capsules and dairy products.",
    manufacturingSummary: "Made by treating animal collagen (from hides and bones) with acid or alkali and hot water to extract gelatine, which is then dried. The animal source (pig, cattle, fish) and its slaughter determine permissibility.",
    halalReasoning: "The concern with gelatine is its origin. Standard commercial gelatine is most often from pork or from cattle that were not halal-slaughtered, which makes it impermissible. That is why we classify plain 'gelatine' as avoid. However, halal-certified gelatine — made from halal-slaughtered cattle or from fish — does exist and is permissible, and there are plant-based gelling substitutes (agar E406, pectin E440, carrageenan E407) that avoid the issue entirely.",
    verificationAdvice: "Treat unspecified 'gelatine' as not halal unless the product is halal-certified. Look for 'halal gelatine', 'fish gelatine' or recognised halal certification, or choose products using plant-based gelling agents.",
    commonUses: ["Gummy sweets and marshmallows", "Jelly and dairy desserts", "Some yoghurts and mousses", "Capsules and some supplements", "Some processed meats"],
    labelNames: ["Gelatine", "Gelatin", "E441", "Beef gelatine", "Pork gelatine", "Fish gelatine"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. A certified product will use an approved (halal) gelatine or a plant alternative; for an uncertified product listing plain 'gelatine', treat it as doubtful-to-avoid and contact the manufacturer.",
    faqs: [
      { q: "Is gelatine (E441) halal or haram?", a: "Standard gelatine is usually from pork or non-halal beef, so it is treated as not halal. Halal-certified gelatine (from halal-slaughtered cattle) and fish gelatine are permissible alternatives." },
      { q: "Is all gelatine from pork?", a: "No. Gelatine can be from pork, cattle or fish. Because the source is often unstated, plain 'gelatine' is treated as not halal unless certified." },
      { q: "What are halal alternatives to gelatine?", a: "Plant-based gelling agents such as agar (E406), pectin (E440) and carrageenan (E407), or specifically halal-certified/fish gelatine." },
      { q: "What names should I look for on a label?", a: "'Gelatine'/'Gelatin' or 'E441'. 'Halal gelatine' or 'fish gelatine' indicate permissible types; plain gelatine should be verified." },
    ],
    relatedCodes: ["E406", "E440", "E407", "E422"],
    sources: [
      codexGsfa("INS 441 and approved uses"),
      muisSource("Gelatine source (halal/plant) is assessed during product certification"),
    ],
    lastReviewed: REVIEWED,
  },

  { code: "E450", name: "Diphosphates", category: "Acidity regulator", status: "halal", origin: "Mineral phosphate salts." },
  { code: "E466", name: "Carboxymethylcellulose (CMC)", category: "Thickener", status: "halal", origin: "From plant cellulose.", aliases: ["cmc", "cellulose gum"] },
  { code: "E470", name: "Fatty acid salts (Mg/Na/K stearates)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Salts of fatty acids that can be animal- or plant-derived." },

  {
    code: "E471", name: "Mono- and diglycerides of fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Emulsifier made from fatty acids that can be plant- OR animal-derived.",
    note: "One of the most common additives. Plant-derived (e.g. palm/soy) is halal; animal-fat sourced is doubtful. Manufacturers must be asked.",
    aliases: ["monoglycerides", "diglycerides", "e471", "mono and diglycerides", "ins 471"],
    insNumber: "471",
    alternativeNames: ["Mono- and diglycerides of fatty acids", "Monoglycerides", "Diglycerides", "Glycerol monostearate (a related form)"],
    fn: "Emulsifier",
    confidence: "medium",
    originType: "variable",
    originSummary: "E471 (Mono- and diglycerides of fatty acids) is a very common emulsifier whose fatty acids can be plant- or animal-derived — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "E471 is one of the most widely used food emulsifiers, helping fat and water blend smoothly in breads, spreads, ice cream and many processed foods. It is made from glycerol and fatty acids — and those fatty acids can come from either vegetable oils or animal fats.",
    manufacturingSummary: "Produced by reacting glycerol with fatty acids (or by interesterifying fats/oils). The fatty acids may originate from palm, soybean or other vegetable oils, or from animal fat (tallow) — the label rarely says which.",
    halalReasoning: "E471's permissibility is source-dependent, which is why it is treated as doubtful. When the fatty acids come from vegetable oil (such as palm or soy), it is halal. When they come from animal fat, it is only permissible if that animal was halal — and because manufacturers seldom state the source, the honest default is 'verify'. The glycerol component can raise the same source question. Many major manufacturers now use vegetable-derived E471, but this should be confirmed rather than assumed.",
    verificationAdvice: "Because the source is usually unstated, treat E471 as doubtful until confirmed. Look for halal certification on the finished product, or ask the manufacturer whether the E471 (and its glycerol) is vegetable- or animal-derived. A 'suitable for vegetarians/vegans' claim also indicates a plant source.",
    commonUses: ["Bread and baked goods", "Ice cream and margarine", "Biscuits and cakes", "Instant noodles and snacks", "Chocolate and spreads"],
    labelNames: ["Mono- and diglycerides of fatty acids", "E471", "Emulsifier (E471)", "Monoglycerides", "Diglycerides"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. A certified product will have had its E471 source assessed; for an uncertified product, contact the manufacturer, since E471 is common and its source is usually not printed on the label.",
    faqs: [
      { q: "Is E471 halal or haram?", a: "E471 is doubtful (mushbooh). Its fatty acids can come from plants (halal) or animal fat (permissible only if from a halal animal). Because the source is usually unstated, treat it as doubtful and verify." },
      { q: "Is E471 made from pork?", a: "It can be made from animal fat, which could include pork-derived tallow, but it is also very commonly made from vegetable oils. Since the label rarely says, confirm with the manufacturer or look for certification." },
      { q: "What is E471 used for?", a: "It is an emulsifier that helps fat and water mix, improving texture in bread, ice cream, margarine and many processed foods." },
      { q: "How can I tell if the E471 in a product is halal?", a: "Look for halal certification, a 'suitable for vegetarians/vegans' claim, or ask the manufacturer whether the E471 is vegetable- or animal-derived." },
    ],
    relatedCodes: ["E472e", "E475", "E322", "E470", "E481"],
    sources: [
      efsaTopic("Re-evaluation of mono- and diglycerides of fatty acids (E 471)", "Source can be vegetable or animal fat"),
      codexGsfa("INS 471 and approved uses"),
      muisSource("Fat source of E471 is assessed during product certification"),
    ],
    lastReviewed: REVIEWED,
  },

  {
    code: "E472e", name: "Mono/diacetyl tartaric acid esters (DATEM)", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Ester of glycerides whose fat source can be animal or plant.",
    aliases: ["datem", "e472", "e472e"],
    insNumber: "472e",
    alternativeNames: ["DATEM", "Diacetyltartaric acid esters of mono- and diglycerides"],
    fn: "Emulsifier / dough conditioner",
    confidence: "medium",
    originType: "variable",
    originSummary: "E472e (DATEM) is a dough-strengthening emulsifier built on mono- and diglycerides whose fat source can be plant or animal — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "DATEM is an emulsifier and dough conditioner widely used to strengthen bread dough and improve loaf volume. It is made from mono- and diglycerides (like E471) reacted with tartaric acid derivatives, and the underlying fat can be vegetable or animal.",
    manufacturingSummary: "Mono- and diglycerides are esterified with diacetyl tartaric acid. The glycerides' fatty acids can come from vegetable oil or animal fat — the label rarely states which.",
    halalReasoning: "Like E471, DATEM is doubtful because the fat used to make its glycerides can be plant- or animal-derived, and the source is usually unstated. Plant-derived DATEM is halal; animal-fat DATEM is only permissible if from a halal animal. Verify before assuming.",
    verificationAdvice: "Look for halal certification or a 'suitable for vegetarians/vegans' claim on the bread/product, or ask the manufacturer whether the DATEM is vegetable- or animal-derived.",
    commonUses: ["Bread and bread rolls", "Wraps, buns and bakery products", "Some coffee whiteners and whipped toppings"],
    labelNames: ["DATEM", "E472e", "Emulsifier (E472e)", "Diacetyltartaric acid esters of mono- and diglycerides"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since DATEM is common in bakery products and its fat source is usually not printed.",
    faqs: [
      { q: "Is E472e (DATEM) halal?", a: "It is doubtful (mushbooh). The fat used to make it can be plant- or animal-derived, and the source is usually unstated — so verify with certification or the manufacturer." },
      { q: "Is DATEM from pork?", a: "It can be made from animal fat, which could include pork-derived sources, but it is also commonly vegetable-derived. Look for certification or ask the manufacturer." },
      { q: "What foods contain DATEM?", a: "It is very common in bread, buns, wraps and bakery products, and in some coffee whiteners and toppings." },
    ],
    relatedCodes: ["E471", "E481", "E482", "E475"],
    sources: [efsaTopic("Re-evaluation of DATEM (E 472e) as a food additive", "Glyceride fat source can be plant or animal"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E475", name: "Polyglycerol esters of fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid esters; source can be animal or plant." },
  { code: "E476", name: "Polyglycerol polyricinoleate (PGPR)", category: "Emulsifier & stabiliser", status: "halal", origin: "Made from castor oil — plant-derived.", aliases: ["pgpr"] },
  {
    code: "E481", name: "Sodium stearoyl-2-lactylate (SSL)", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Stearoyl (fatty acid) source can be animal or plant.",
    aliases: ["ssl", "e481", "sodium stearoyl lactylate"],
    insNumber: "481",
    alternativeNames: ["Sodium stearoyl lactylate", "SSL", "Sodium stearoyl-2-lactylate"],
    fn: "Emulsifier / dough conditioner",
    confidence: "medium",
    originType: "variable",
    originSummary: "E481 (Sodium stearoyl-2-lactylate, SSL) is a dough-conditioning emulsifier whose stearic-acid (stearoyl) part can be plant- or animal-derived — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "SSL is an emulsifier and dough conditioner made from stearic acid (a fatty acid) and lactic acid. It strengthens dough and improves texture in baked and processed foods.",
    manufacturingSummary: "Stearic acid is reacted with lactic acid and neutralised with sodium. The stearic acid can come from vegetable oil or animal fat — the label rarely says which.",
    halalReasoning: "SSL is doubtful because its stearic-acid component can be plant- or animal-derived, and the source is usually unstated. Plant-derived SSL is halal; animal-fat SSL is only permissible if from a halal animal. Verify before assuming.",
    verificationAdvice: "Look for halal certification or a 'suitable for vegetarians/vegans' claim, or ask the manufacturer whether the stearic acid is vegetable- or animal-derived.",
    commonUses: ["Bread and baked goods", "Cake mixes and biscuits", "Coffee whiteners and dessert toppings", "Some snack foods"],
    labelNames: ["Sodium stearoyl lactylate", "SSL", "E481", "Emulsifier (E481)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since the stearic-acid source is usually not printed on the label.",
    faqs: [
      { q: "Is E481 (SSL) halal?", a: "It is doubtful (mushbooh). Its stearic acid can be plant- or animal-derived, and the source is usually unstated — verify with certification or the manufacturer." },
      { q: "Is E481 from pork?", a: "Its stearic acid can be animal-derived (possibly including pork sources), but it is also commonly plant-derived. Confirm via certification or the manufacturer." },
      { q: "What names should I look for?", a: "'Sodium stearoyl lactylate', 'SSL' or 'E481'." },
    ],
    relatedCodes: ["E482", "E471", "E472e", "E570"],
    sources: [efsaTopic("Re-evaluation of sodium stearoyl-2-lactylate (E 481) as a food additive", "Stearic-acid source can be plant or animal"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  {
    code: "E482", name: "Calcium stearoyl-2-lactylate (CSL)", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Stearoyl (fatty acid) source can be animal or plant.",
    aliases: ["csl", "e482", "calcium stearoyl lactylate"],
    insNumber: "482",
    alternativeNames: ["Calcium stearoyl lactylate", "CSL", "Calcium stearoyl-2-lactylate"],
    fn: "Emulsifier / dough conditioner",
    confidence: "medium",
    originType: "variable",
    originSummary: "E482 (Calcium stearoyl-2-lactylate, CSL) is a dough-conditioning emulsifier whose stearic-acid part can be plant- or animal-derived — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "CSL is an emulsifier and dough conditioner closely related to SSL (E481), made from stearic acid and lactic acid with calcium. It improves dough strength and texture in baked and processed foods.",
    manufacturingSummary: "Stearic acid is reacted with lactic acid and neutralised with calcium. The stearic acid can come from vegetable oil or animal fat — the label rarely says which.",
    halalReasoning: "CSL is doubtful because its stearic-acid component can be plant- or animal-derived, and the source is usually unstated. Plant-derived CSL is halal; animal-fat CSL is only permissible if from a halal animal. Verify before assuming.",
    verificationAdvice: "Look for halal certification or a 'suitable for vegetarians/vegans' claim, or ask the manufacturer whether the stearic acid is vegetable- or animal-derived.",
    commonUses: ["Bread and baked goods", "Cake mixes and biscuits", "Dessert toppings and whiteners", "Some snack foods"],
    labelNames: ["Calcium stearoyl lactylate", "CSL", "E482", "Emulsifier (E482)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since the stearic-acid source is usually not printed on the label.",
    faqs: [
      { q: "Is E482 (CSL) halal?", a: "It is doubtful (mushbooh). Its stearic acid can be plant- or animal-derived, and the source is usually unstated — verify with certification or the manufacturer." },
      { q: "Is E482 the same as E481?", a: "They are closely related dough conditioners; E482 (CSL) uses calcium and E481 (SSL) uses sodium. Both are source-dependent." },
      { q: "What names should I look for?", a: "'Calcium stearoyl lactylate', 'CSL' or 'E482'." },
    ],
    relatedCodes: ["E481", "E471", "E472e", "E570"],
    sources: [efsaTopic("Re-evaluation of calcium stearoyl-2-lactylate (E 482) as a food additive", "Stearic-acid source can be plant or animal"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E491", name: "Sorbitan monostearate", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid ester; source can be animal or plant." },

  // ── Anti-caking & minerals ─────────────────────────────────────────────────
  { code: "E500", name: "Sodium bicarbonate (baking soda)", category: "Acidity regulator", status: "halal", origin: "Mineral salt.", aliases: ["baking soda", "bicarbonate of soda"] },
  { code: "E501", name: "Potassium carbonate", category: "Acidity regulator", status: "halal", origin: "Mineral salt." },
  { code: "E508", name: "Potassium chloride", category: "Other", status: "halal", origin: "Mineral salt." },
  { code: "E509", name: "Calcium chloride", category: "Other", status: "halal", origin: "Mineral salt." },
  { code: "E524", name: "Sodium hydroxide", category: "Acidity regulator", status: "halal", origin: "Alkali (lye) — mineral/chemical." },
  {
    code: "E542", name: "Bone phosphate (edible)", category: "Anti-caking", status: "mushbooh",
    origin: "Made from animal bones — the animal source is usually unspecified.",
    note: "Halal only if from halal-slaughtered animals; mineral phosphates (E341) are a halal alternative.",
    aliases: ["bone phosphate", "e542", "edible bone phosphate"],
    insNumber: "542",
    alternativeNames: ["Bone phosphate", "Edible bone phosphate", "Calcium phosphate (from bone)"],
    fn: "Anti-caking / emulsifier",
    confidence: "high",
    originType: "animal",
    originSummary: "E542 (Bone phosphate) is made from animal bones and its animal source is usually unspecified — so it is treated as doubtful (mushbooh) and is halal only if the animal was halal.",
    description: "Bone phosphate is derived from animal bones and used as an anti-caking agent and emulsifier. Because it is animal-derived, its permissibility depends on the animal and its slaughter, which are usually not stated.",
    manufacturingSummary: "Produced by processing animal bones into a phosphate. The animal species and slaughter method are usually not identified.",
    halalReasoning: "E542 is animal-derived, so it is halal only if it comes from a halal-slaughtered, permissible animal. Because the source is usually unspecified, it is treated as doubtful. Mineral phosphates such as calcium phosphate (E341) are a halal alternative that manufacturers can use instead.",
    verificationAdvice: "Treat unspecified bone phosphate as doubtful; look for halal certification or a mineral-phosphate alternative (E341), or ask the manufacturer about the source.",
    commonUses: ["Anti-caking in powdered foods", "Some supplements and tablets", "Certain processed foods"],
    labelNames: ["Bone phosphate", "Edible bone phosphate", "E542"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. An uncertified product listing bone phosphate should be treated as doubtful; contact the manufacturer about the source.",
    faqs: [
      { q: "Is E542 (bone phosphate) halal?", a: "It is animal-derived, so it is halal only if from a halal-slaughtered animal. Because the source is usually unstated, it is treated as doubtful — verify or choose a mineral-phosphate alternative." },
      { q: "What is a halal alternative to bone phosphate?", a: "Mineral phosphates such as calcium phosphate (E341) are halal alternatives." },
      { q: "What names should I look for?", a: "'Bone phosphate', 'Edible bone phosphate' or 'E542'." },
    ],
    relatedCodes: ["E341", "E339", "E441"],
    sources: [codexGsfa("INS 542 and approved uses"), muisSource("Animal source of bone phosphate assessed during certification")],
    lastReviewed: REVIEWED,
  },
  { code: "E551", name: "Silicon dioxide", category: "Anti-caking", status: "halal", origin: "Mineral (silica).", aliases: ["silica"] },
  {
    code: "E570", name: "Stearic acid / Fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Fatty acid that can be animal- or plant-derived.",
    aliases: ["stearic acid", "e570", "fatty acids", "octadecanoic acid"],
    insNumber: "570",
    alternativeNames: ["Stearic acid", "Fatty acids", "Octadecanoic acid"],
    fn: "Emulsifier / anti-caking / glazing",
    confidence: "medium",
    originType: "variable",
    originSummary: "E570 (Stearic acid / fatty acids) is a fatty acid that can be animal- or plant-derived — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Stearic acid is a fatty acid used as an emulsifier, anti-caking agent and glazing agent in foods, and widely in supplements, tablets and cosmetics. It can be obtained from vegetable oils or from animal fats.",
    manufacturingSummary: "Obtained by splitting fats and oils into their fatty acids. The feedstock can be vegetable (e.g. palm) or animal (tallow) — the label rarely says which.",
    halalReasoning: "Stearic acid is doubtful because it can be plant- or animal-derived, and the source is usually unstated. Plant-derived stearic acid is halal; animal-fat stearic acid is only permissible if from a halal animal. Verify before assuming — much commercial stearic acid is palm-derived, but this should be confirmed.",
    verificationAdvice: "Look for halal certification or a 'vegetable-derived / suitable for vegetarians' claim, or ask the manufacturer whether the stearic acid is plant- or animal-derived.",
    commonUses: ["Confectionery and baked goods", "Supplements and tablets", "Chewing gum", "Cosmetics and personal care (non-food)"],
    labelNames: ["Stearic acid", "Fatty acids", "E570", "Octadecanoic acid"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since the fat source is usually not printed on the label.",
    faqs: [
      { q: "Is E570 (stearic acid) halal?", a: "It is doubtful (mushbooh). It can be plant- or animal-derived, and the source is usually unstated — verify with certification or the manufacturer." },
      { q: "Is stearic acid from pork?", a: "It can be from animal fat (possibly including pork sources), but it is also commonly palm/vegetable-derived. Confirm via certification or the manufacturer." },
      { q: "What names should I look for?", a: "'Stearic acid', 'Fatty acids' or 'E570'." },
    ],
    relatedCodes: ["E572", "E470", "E471", "E422"],
    sources: [efsaTopic("Re-evaluation of fatty acids (E 570) as a food additive", "Source can be plant or animal fat"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  {
    code: "E572", name: "Magnesium stearate", category: "Emulsifier & stabiliser", status: "mushbooh",
    origin: "Fatty-acid salt; source can be animal or plant.",
    aliases: ["magnesium stearate", "e572"],
    insNumber: "572",
    alternativeNames: ["Magnesium stearate", "Magnesium salts of fatty acids"],
    fn: "Emulsifier / anti-caking / release agent",
    confidence: "medium",
    originType: "variable",
    originSummary: "E572 (Magnesium stearate) is a magnesium salt of stearic acid whose fat source can be animal or plant — so it is treated as doubtful (mushbooh) unless the source is known. It is best known as a tablet/capsule lubricant.",
    description: "Magnesium stearate is the magnesium salt of stearic acid, used mainly as an anti-caking and release agent — very commonly as a flow agent in tablets, capsules and supplements, and in some powdered foods.",
    manufacturingSummary: "Made by combining magnesium with stearic acid. The stearic acid can come from vegetable oil or animal fat — the label rarely says which.",
    halalReasoning: "Magnesium stearate is doubtful because its stearic acid can be plant- or animal-derived, and the source is usually unstated. Plant-derived magnesium stearate is halal; animal-fat versions are only permissible if from a halal animal. Because it is so common in tablets and supplements, verification matters to many people.",
    verificationAdvice: "For supplements and medicines, look for halal certification or a 'vegetable-derived / suitable for vegetarians' claim, or ask the manufacturer whether the stearate is plant- or animal-derived.",
    commonUses: ["Tablets, capsules and supplements", "Powdered foods and mixes", "Confectionery and chewing gum", "Some seasonings"],
    labelNames: ["Magnesium stearate", "E572", "Magnesium salts of fatty acids"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer — this is a very common supplement/tablet ingredient and its source is usually not printed.",
    faqs: [
      { q: "Is E572 (magnesium stearate) halal?", a: "It is doubtful (mushbooh). Its stearic acid can be plant- or animal-derived, and the source is usually unstated — verify with certification or the manufacturer." },
      { q: "Is the magnesium stearate in supplements halal?", a: "It depends on its source, which is usually not stated. Look for halal certification or a vegetable-source claim, or ask the manufacturer." },
      { q: "What names should I look for?", a: "'Magnesium stearate' or 'E572'." },
    ],
    relatedCodes: ["E570", "E470", "E471", "E322"],
    sources: [efsaTopic("Re-evaluation of magnesium salts of fatty acids (E 470b/E 572) as food additives", "Fat source can be plant or animal"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E575", name: "Glucono delta-lactone (GDL)", category: "Acidity regulator", status: "halal", origin: "From glucose — plant-based.", aliases: ["gdl"] },

  // ── Flavour enhancers ──────────────────────────────────────────────────────
  {
    code: "E621", name: "Monosodium glutamate (MSG)", category: "Flavour enhancer", status: "halal",
    origin: "Made by fermentation of plant starches/molasses.",
    note: "Widely accepted as halal; a small number of bodies flag the fermentation medium — check if strict.",
    aliases: ["msg", "monosodium glutamate", "e621", "ajinomoto", "ins 621"],
    insNumber: "621",
    alternativeNames: ["Monosodium glutamate", "MSG", "Sodium glutamate"],
    fn: "Flavour enhancer",
    confidence: "high",
    originType: "microbial",
    originSummary: "E621 (Monosodium glutamate / MSG) is made by fermenting plant starches or molasses and is widely accepted as halal; a strict check would confirm the fermentation medium.",
    description: "Monosodium glutamate is the sodium salt of glutamic acid, used to add a savoury 'umami' taste. Modern MSG is produced by fermenting plant-based carbohydrates such as starch, sugar beet or molasses — a process similar to making vinegar or yoghurt.",
    manufacturingSummary: "Produced by bacterial fermentation of plant sugars/starches to glutamic acid, which is then neutralised with sodium to form MSG. The process is plant- and microbe-based.",
    halalReasoning: "MSG is widely accepted as halal because it is produced by fermentation of plant-based materials and is not animal-derived. A small number of strict bodies ask about the fermentation medium and any processing aids; for full certainty, look for halal certification. The additive itself contains no prohibited component.",
    verificationAdvice: "MSG is generally halal. If you follow a strict standard, choose a halal-certified product or ask the manufacturer about the fermentation medium.",
    commonUses: ["Savoury snacks and crisps", "Instant noodles and stock cubes", "Seasonings and sauces", "Ready meals and soups"],
    labelNames: ["Monosodium glutamate", "MSG", "E621", "Flavour enhancer (E621)"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    healthSummary: "Halal does not automatically mean healthy. MSG is classified as generally safe by food-safety authorities; some people report short-term sensitivity, which has not been consistently reproduced in controlled studies. This is a food-safety topic, separate from halal status.",
    faqs: [
      { q: "Is E621 (MSG) halal?", a: "Yes — MSG is made by fermenting plant-based materials and is widely accepted as halal. A strict check would confirm the fermentation medium." },
      { q: "Is MSG made from animals?", a: "No. Modern MSG is produced by fermentation of plant sugars/starches." },
      { q: "What foods may contain MSG?", a: "Savoury snacks, instant noodles, stock cubes, seasonings and ready meals may contain it. 'May contain' is not 'always contains'." },
      { q: "What names should I look for?", a: "'Monosodium glutamate', 'MSG' or 'E621'." },
    ],
    relatedCodes: ["E627", "E631", "E635"],
    sources: [
      efsaTopic("Re-evaluation of glutamic acid and glutamates (E 620–625)", "Fermentation origin and safety re-evaluation"),
      codexGsfa("INS 621 and approved uses"),
      muisSource("Fermentation medium assessed during certification"),
    ],
    lastReviewed: REVIEWED,
  },

  {
    code: "E627", name: "Disodium guanylate", category: "Flavour enhancer", status: "mushbooh",
    origin: "Flavour enhancer that can be derived from yeast, fish, or meat.",
    note: "Often paired with E631; the animal/fish source is usually unstated.",
    aliases: ["disodium guanylate", "e627", "sodium guanylate", "gmp"],
    insNumber: "627",
    alternativeNames: ["Disodium guanylate", "Disodium 5'-guanylate", "GMP"],
    fn: "Flavour enhancer",
    confidence: "medium",
    originType: "variable",
    originSummary: "E627 (Disodium guanylate) is a flavour enhancer that can be derived from yeast, fish or meat — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Disodium guanylate is a flavour enhancer, usually used together with MSG (E621) and disodium inosinate (E631) to boost savoury taste. It can be produced from yeast, or derived from fish or meat.",
    manufacturingSummary: "Obtained from yeast extract, by fermentation, or by processing fish/meat tissue. The source is almost never stated on the label.",
    halalReasoning: "E627 is doubtful because its source varies. If it is yeast-derived or microbial it is permissible; if from non-halal meat it is not; fish-derived versions also matter to anyone avoiding fish. Because the source is rarely stated — and it very commonly appears alongside E621 and E631 in snacks and instant foods — the honest default is to verify.",
    verificationAdvice: "Treat E627 as doubtful until confirmed. Look for halal certification, or ask the manufacturer whether it is yeast/microbial, fish- or meat-derived.",
    commonUses: ["Savoury snacks and crisps", "Instant noodles and seasonings", "Stock cubes and ready meals", "Processed savoury foods"],
    labelNames: ["Disodium guanylate", "E627", "Flavour enhancer (E627)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since the source of E627 is usually not printed.",
    faqs: [
      { q: "Is E627 (disodium guanylate) halal?", a: "It is doubtful (mushbooh). It can be from yeast, fish or meat, and the source is usually unstated — verify with certification or the manufacturer." },
      { q: "Is E627 from pork?", a: "It can be derived from meat (possibly including pork sources), but it may also be from yeast or fish. Confirm via certification or the manufacturer." },
      { q: "What names should I look for?", a: "'Disodium guanylate', 'E627' — often listed with E621 and E631." },
    ],
    relatedCodes: ["E631", "E635", "E621"],
    sources: [codexGsfa("INS 627 and approved uses"), efsaTopic("Guanylate flavour enhancers (E 626-629)", "Possible yeast/fish/meat sourcing"), muisSource()],
    lastReviewed: REVIEWED,
  },

  {
    code: "E631", name: "Disodium inosinate", category: "Flavour enhancer", status: "mushbooh",
    origin: "Commonly derived from fish or meat (can also be microbial).",
    note: "Very common in snacks/instant noodles; confirm the source.",
    aliases: ["e631", "disodium inosinate", "ins 631", "im"],
    insNumber: "631",
    alternativeNames: ["Disodium inosinate", "Disodium 5'-inosinate", "IMP"],
    fn: "Flavour enhancer",
    confidence: "medium",
    originType: "variable",
    originSummary: "E631 (Disodium inosinate) is a flavour enhancer that is commonly derived from fish or meat, though it can also be microbial — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Disodium inosinate is a flavour enhancer, usually used together with MSG (E621) to boost savoury taste in snacks and instant foods. It can be produced from fish (such as sardines), from meat, or by microbial fermentation.",
    manufacturingSummary: "Obtained from meat or fish tissue, or produced by microbial fermentation. The label rarely states which route was used.",
    halalReasoning: "E631 is treated as doubtful because its source varies. If it is microbial or from halal fish, it is permissible; if it is from non-halal meat, it is not. Because the source is almost never stated on the label — and it very commonly appears in snacks and instant noodles alongside E621 and E627 — the honest default is to verify. Note that fish-derived versions also matter to anyone avoiding fish.",
    verificationAdvice: "Treat E631 as doubtful until confirmed. Look for halal certification on the finished product, or ask the manufacturer whether the E631 is microbial, fish- or meat-derived.",
    commonUses: ["Savoury snacks and crisps", "Instant noodles and seasonings", "Stock cubes and ready meals", "Processed savoury foods"],
    labelNames: ["Disodium inosinate", "E631", "Flavour enhancer (E631)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. A certified product will have had its E631 source assessed; for an uncertified product listing E631, treat it as doubtful and contact the manufacturer.",
    faqs: [
      { q: "Is E631 (disodium inosinate) halal or haram?", a: "It is doubtful (mushbooh). It can be from fish, meat or microbial fermentation. If it may be from non-halal meat, it is best avoided unless the product is certified or the source is confirmed." },
      { q: "Is E631 made from pork?", a: "It can be derived from meat, which could include pork, but it may also be from fish or microbial sources. Because the label rarely says, verify with the manufacturer or look for certification." },
      { q: "What foods may contain E631?", a: "It is very common in savoury snacks, instant noodles, seasonings and stock cubes, usually alongside MSG (E621)." },
      { q: "How do I verify E631 in Singapore?", a: "Check the finished product on the MUIS HalalSG register, or ask the manufacturer whether the E631 is microbial, fish- or meat-derived." },
    ],
    relatedCodes: ["E621", "E627", "E635"],
    sources: [
      codexGsfa("INS 631 and approved uses"),
      efsaTopic("Inosinic acid and inosinate flavour enhancers (E 630–633)", "Possible fish/meat/microbial sourcing"),
      muisSource("Source of E631 is assessed during product certification"),
    ],
    lastReviewed: REVIEWED,
  },

  {
    code: "E635", name: "Disodium 5'-ribonucleotides", category: "Flavour enhancer", status: "mushbooh",
    origin: "Blend of E627/E631; source can be animal, fish or microbial.",
    aliases: ["disodium 5'-ribonucleotides", "e635", "disodium ribonucleotides", "i&g"],
    insNumber: "635",
    alternativeNames: ["Disodium 5'-ribonucleotides", "Disodium ribonucleotides", "I+G"],
    fn: "Flavour enhancer",
    confidence: "medium",
    originType: "variable",
    originSummary: "E635 (Disodium 5'-ribonucleotides) is a blend of disodium guanylate (E627) and disodium inosinate (E631) whose sources can be microbial, fish or meat — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Disodium 5'-ribonucleotides is a very common flavour enhancer — a blend of E627 and E631 — used with MSG (E621) to boost savoury taste in snacks and instant foods. Like its components, it can be microbial, fish- or meat-derived.",
    manufacturingSummary: "Made by combining disodium guanylate and disodium inosinate, which can be produced by fermentation or derived from fish/meat. The source is almost never stated.",
    halalReasoning: "E635 is doubtful because it inherits the source questions of E627 and E631 — microbial versions are permissible, fish- or meat-derived versions depend on the source (and fish matters to those avoiding it). Because it very commonly appears alongside E621 in snacks and its source is unstated, the honest default is to verify.",
    verificationAdvice: "Treat E635 as doubtful until confirmed. Look for halal certification, or ask the manufacturer whether the E627/E631 in it is microbial, fish- or meat-derived.",
    commonUses: ["Savoury snacks and crisps", "Instant noodles and seasonings", "Stock cubes and ready meals", "Processed savoury foods"],
    labelNames: ["Disodium 5'-ribonucleotides", "E635", "Flavour enhancer (E635)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since the source of E635 is usually not printed.",
    faqs: [
      { q: "Is E635 (disodium 5'-ribonucleotides) halal?", a: "It is doubtful (mushbooh). It is a blend of E627 and E631, whose sources can be microbial, fish or meat and are usually unstated — verify with certification or the manufacturer." },
      { q: "Is E635 from pork?", a: "Its components can be derived from meat (possibly including pork sources), but may also be microbial or fish. Confirm via certification or the manufacturer." },
      { q: "What names should I look for?", a: "'Disodium 5'-ribonucleotides', 'E635' — usually listed with E621." },
    ],
    relatedCodes: ["E627", "E631", "E621"],
    sources: [codexGsfa("INS 635 and approved uses"), muisSource("Source of the ribonucleotides assessed during certification")],
    lastReviewed: REVIEWED,
  },
  {
    code: "E640", name: "Glycine & sodium glycinate", category: "Flavour enhancer", status: "mushbooh",
    origin: "Amino acid that can be synthetic or animal-derived.",
    aliases: ["glycine", "sodium glycinate", "e640"],
    insNumber: "640",
    alternativeNames: ["Glycine", "Sodium glycinate", "Aminoacetic acid"],
    fn: "Flavour enhancer / masking agent",
    confidence: "medium",
    originType: "variable",
    originSummary: "E640 (Glycine & sodium glycinate) is an amino acid that can be produced synthetically or derived from animal protein — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "Glycine is the simplest amino acid, used in small amounts as a flavour enhancer and taste modifier. It can be made synthetically or obtained from protein (which may be animal-derived).",
    manufacturingSummary: "Produced by chemical synthesis, or by hydrolysing protein — which can be plant or animal in origin. The source is rarely stated.",
    halalReasoning: "Glycine is doubtful because it can be synthetic (halal) or extracted from animal protein (permissible only if from a halal animal). Because the source is usually unstated, it is treated as doubtful until confirmed. Much commercial glycine is synthetic, but this should be verified.",
    verificationAdvice: "Look for halal certification or a synthetic/plant-source indication, or ask the manufacturer whether the glycine is synthetic or animal-derived.",
    commonUses: ["Flavour blends and seasonings", "Some beverages and supplements", "Processed foods (as a taste modifier)"],
    labelNames: ["Glycine", "Sodium glycinate", "E640"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer if the source is unclear.",
    faqs: [
      { q: "Is E640 (glycine) halal?", a: "It is doubtful (mushbooh). It can be synthetic (halal) or from animal protein (permissible only if from a halal animal). Since the source is usually unstated, verify with certification or the manufacturer." },
      { q: "Is glycine from animals?", a: "It can be — glycine can be synthetic or obtained from animal protein. Much commercial glycine is synthetic, but confirm the source." },
      { q: "What names should I look for?", a: "'Glycine', 'Sodium glycinate' or 'E640'." },
    ],
    relatedCodes: ["E621", "E627", "E631"],
    sources: [efsaTopic("Glycine and its sodium salt (E 640) — food additive information", "Synthetic or protein-derived origin"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },

  // ── Glazing, waxes & flour treatment ───────────────────────────────────────
  { code: "E901", name: "Beeswax", category: "Glazing & wax", status: "halal", origin: "Produced by honeybees — generally permissible, like honey." },
  { code: "E903", name: "Carnauba wax", category: "Glazing & wax", status: "halal", origin: "From the carnauba palm — plant-derived." },
  {
    code: "E904", name: "Shellac", category: "Glazing & wax", status: "mushbooh",
    origin: "Resin secreted by the lac insect.",
    note: "Scholars differ — some permit it as a secretion (like honey), others avoid it as insect-derived.",
    aliases: ["shellac", "e904", "confectioner's glaze", "lac resin"],
    insNumber: "904",
    alternativeNames: ["Shellac", "Confectioner's glaze", "Lac resin", "Food glaze"],
    fn: "Glazing agent / surface coating",
    confidence: "medium",
    originType: "insect",
    originSummary: "E904 (Shellac) is a resin secreted by the lac insect and used as a glaze; scholars differ on insect secretions, so it is treated as doubtful (mushbooh).",
    description: "Shellac is a resin secreted by the female lac insect on trees, refined into flakes and dissolved to make a food glaze. It gives a shiny coating to sweets, chocolates and coated tablets, and is used to wax some fruits.",
    manufacturingSummary: "The lac resin is scraped from tree branches, purified and processed into shellac. As a food glaze it is usually dissolved in ethanol and applied as a thin coating (the solvent evaporates).",
    halalReasoning: "Shellac is treated as doubtful because scholars differ on insect secretions: some permit it by analogy with honey (a product secreted by an insect, not the insect's body), while others avoid it because it is insect-derived and may carry insect fragments. A further point to check is that food-grade shellac is typically applied using an ethanol carrier; opinions differ on residual solvent. Given the disagreement, the cautious approach is to verify or avoid.",
    verificationAdvice: "If you follow the stricter view, avoid shellac or choose products glazed with carnauba wax (E903) or beeswax (E901) where those are acceptable to you. Otherwise look for halal certification that specifically covers the glaze.",
    commonUses: ["Coated chocolates and sweets (shiny shells)", "Chewing gum", "Coated tablets and supplements", "Wax coatings on some fruits"],
    labelNames: ["Shellac", "E904", "Glazing agent (E904)", "Confectioner's glaze"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register. Where a product is certified, the glaze will have been assessed; otherwise contact the manufacturer if you are unsure about the glaze.",
    faqs: [
      { q: "Is E904 (shellac) halal?", a: "Scholars differ. Some permit it as an insect secretion (like honey); others avoid it as insect-derived. It is treated as doubtful, so verify or choose a plant/beeswax glaze if you follow the stricter view." },
      { q: "Is shellac made from insects?", a: "It is a resin secreted by the lac insect, refined into a glaze. It is a secretion rather than the insect's body, which is why scholars differ on it." },
      { q: "What are alternatives to shellac?", a: "Carnauba wax (E903, plant) and beeswax (E901) are common glazing alternatives." },
      { q: "What names should I look for?", a: "'Shellac', 'E904', 'Confectioner's glaze' or 'Glazing agent (E904)'." },
    ],
    relatedCodes: ["E901", "E903", "E120"],
    sources: [efsaTopic("Shellac (E 904) — food additive information", "Insect-secretion origin and use as a glaze"), codexGsfa(), muisSource("Glaze is assessed during product certification")],
    lastReviewed: REVIEWED,
  },
  {
    code: "E920", name: "L-Cysteine", category: "Flour treatment", status: "mushbooh",
    origin: "Dough conditioner that can be made from human hair, duck/chicken feathers, or synthetically.",
    note: "Synthetic and microbial L-cysteine is halal; feather/hair-derived is doubtful.",
    aliases: ["cysteine", "e920", "l-cysteine", "l-cysteine hydrochloride"],
    insNumber: "920",
    alternativeNames: ["L-Cysteine", "L-Cysteine hydrochloride", "Cysteine"],
    fn: "Flour treatment / dough conditioner",
    confidence: "medium",
    originType: "variable",
    originSummary: "E920 (L-Cysteine) is a dough conditioner that can be produced synthetically, by microbial fermentation, or extracted from feathers or human hair — so it is treated as doubtful (mushbooh) unless the source is known.",
    description: "L-Cysteine is an amino acid used to soften and condition dough, helping to speed up bread-making and improve texture. It is notable because it can be made in very different ways — including from duck or chicken feathers, and historically from human hair, as well as synthetically or by fermentation.",
    manufacturingSummary: "Produced by microbial fermentation or synthesis, or extracted by hydrolysing keratin from feathers or hair. The source is almost never stated on the label.",
    halalReasoning: "L-Cysteine is doubtful because of its possible sources. Synthetic and microbial (fermentation) L-cysteine is halal. Feather-derived L-cysteine raises the question of the bird's source, and human-hair-derived L-cysteine is rejected by scholars as it should not come from human parts. Because the source is not stated, it is treated as doubtful until confirmed.",
    verificationAdvice: "Look for halal certification on the bread/product, or ask the manufacturer whether the L-cysteine is synthetic/microbial (halal) rather than feather- or hair-derived.",
    commonUses: ["Bread, buns and bagels", "Pizza dough and wraps", "Some baked goods", "Occasionally in flavourings and supplements"],
    labelNames: ["L-Cysteine", "L-Cysteine hydrochloride", "E920", "Flour treatment agent (E920)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer, since the source of L-cysteine is not printed and matters for its halal status.",
    faqs: [
      { q: "Is E920 (L-Cysteine) halal?", a: "It depends on the source. Synthetic and microbial L-cysteine is halal; feather-derived is doubtful and human-hair-derived is not acceptable. Since the source is usually unstated, treat it as doubtful and verify." },
      { q: "Is L-cysteine made from human hair?", a: "It can be — historically some L-cysteine was made from human hair, which scholars reject. It can also come from duck/chicken feathers or from synthetic/microbial production. Verify the source." },
      { q: "What foods may contain E920?", a: "It is used mainly in bread and bakery dough (buns, bagels, pizza, wraps)." },
      { q: "What names should I look for?", a: "'L-Cysteine', 'L-Cysteine hydrochloride' or 'E920'." },
    ],
    relatedCodes: ["E471", "E472e", "E481"],
    sources: [efsaTopic("L-Cysteine (E 920) — food additive information", "Possible synthetic, microbial, feather or hair sources"), codexGsfa(), muisSource("Source of L-cysteine is assessed during product certification")],
    lastReviewed: REVIEWED,
  },

  // ── Sweeteners ─────────────────────────────────────────────────────────────
  { code: "E950", name: "Acesulfame K", category: "Sweetener", status: "halal", origin: "Synthetic sweetener.", aliases: ["ace k"] },

  {
    code: "E951", name: "Aspartame", category: "Sweetener", status: "halal",
    origin: "Synthetic sweetener.",
    aliases: ["aspartame", "e951", "ins 951", "nutrasweet"],
    insNumber: "951",
    alternativeNames: ["Aspartame", "NutraSweet", "Canderel (brand)"],
    fn: "Sweetener (high-intensity)",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E951 (Aspartame) is a synthetic high-intensity sweetener with no animal origin, so it is generally considered halal at the ingredient level.",
    description: "Aspartame is a low-calorie sweetener about 200 times sweeter than sugar, used in diet drinks, sugar-free gum and tabletop sweeteners. It is made by joining two amino acids (aspartic acid and phenylalanine) and is manufactured synthetically.",
    manufacturingSummary: "Produced by chemical/enzymatic synthesis combining aspartic acid and phenylalanine (as a methyl ester). Commercial production is not animal-based.",
    halalReasoning: "Aspartame is generally classified as halal because it is synthesised and contains no prohibited animal or alcohol component. As with any additive, a finished product still needs its own verification.",
    verificationAdvice: "Aspartame itself is generally halal. For a finished product, confirm the whole ingredient list and any halal certification.",
    commonUses: ["Diet and sugar-free soft drinks", "Sugar-free chewing gum", "Tabletop sweeteners", "Low-calorie desserts and yoghurts"],
    labelNames: ["Aspartame", "E951", "Sweetener (E951)", "Contains a source of phenylalanine"],
    singaporeGuidance: "Ingredient guidance is not certification. Verify the finished product on the MUIS HalalSG register or with the manufacturer.",
    healthSummary: "Halal does not automatically mean healthy, and a health concern does not automatically make an ingredient haram. Aspartame must carry a warning for people with the genetic condition phenylketonuria (PKU) because it contains phenylalanine. In 2023 the WHO's cancer agency (IARC) classified aspartame as 'possibly carcinogenic to humans' (Group 2B), while the JECFA expert committee reaffirmed the acceptable daily intake of 40 mg per kg of body weight. These are food-safety assessments, separate from halal status.",
    regulatorySummary: "Permitted as a sweetener in the EU, UK, US and many other markets within an established acceptable daily intake. Products must declare that it is a source of phenylalanine.",
    faqs: [
      { q: "Is E951 (aspartame) halal?", a: "Yes — aspartame is a synthetic sweetener with no animal origin, so it is generally considered halal at the ingredient level. The finished product still needs verification." },
      { q: "Is aspartame made from animals?", a: "No. It is manufactured synthetically from two amino acids." },
      { q: "Is aspartame safe?", a: "Regulators permit it within a set daily intake. It carries a PKU warning (contains phenylalanine), and IARC classifies it as 'possibly carcinogenic (Group 2B)' while JECFA kept the acceptable daily intake unchanged. This is a health question, separate from halal status." },
      { q: "What names should I look for?", a: "'Aspartame', 'E951' or a 'contains a source of phenylalanine' statement." },
    ],
    relatedCodes: ["E950", "E954", "E955", "E960"],
    sources: [
      efsaTopic("Re-evaluation of aspartame (E 951) as a food additive", "Synthetic origin and acceptable daily intake"),
      {
        title: "Aspartame hazard and risk assessment (IARC / JECFA joint findings, 2023)",
        organisation: "World Health Organization (IARC & JECFA)",
        url: "https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released",
        sourceType: "scientific",
        accessedDate: REVIEWED,
        supports: "Health context (Group 2B classification; ADI reaffirmed) — separate from halal status",
      },
      codexGsfa("INS 951 and approved uses"),
      muisSource(),
    ],
    lastReviewed: REVIEWED,
  },

  { code: "E954", name: "Saccharin", category: "Sweetener", status: "halal", origin: "Synthetic sweetener." },
  { code: "E955", name: "Sucralose", category: "Sweetener", status: "halal", origin: "Synthetic sweetener made from sugar." },
  { code: "E960", name: "Steviol glycosides (Stevia)", category: "Sweetener", status: "halal", origin: "From the stevia plant.", aliases: ["stevia"] },
  { code: "E965", name: "Maltitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol from starch." },
  { code: "E967", name: "Xylitol", category: "Sweetener", status: "halal", origin: "Sugar alcohol from plant fibre." },

  // ── Other / alcohol ────────────────────────────────────────────────────────
  {
    code: "E1105", name: "Lysozyme", category: "Preservative", status: "mushbooh",
    origin: "Enzyme usually extracted from egg white.",
    note: "Halal if the egg source is acceptable; some avoid due to processing aids.",
    aliases: ["lysozyme", "e1105", "egg white lysozyme"],
    insNumber: "1105",
    alternativeNames: ["Lysozyme", "Egg-white lysozyme"],
    fn: "Preservative (enzyme)",
    confidence: "medium",
    originType: "variable",
    originSummary: "E1105 (Lysozyme) is an enzyme usually extracted from egg white; it is generally halal if the egg is acceptable, but is treated as doubtful because the source and any processing aids are seldom stated.",
    description: "Lysozyme is an enzyme, obtained mainly from hen egg white, used as a preservative — notably to prevent late blowing (gas defects) in some hard cheeses. It is also an allergen concern for those avoiding egg.",
    manufacturingSummary: "Extracted and purified from egg white. Processing aids may be used during purification.",
    halalReasoning: "Lysozyme from egg white is generally acceptable to most scholars, since eggs are halal — so the enzyme itself is usually treated as permissible. It is presented as doubtful because the source and any processing aids are seldom stated, and some prefer to verify. It is also important information for anyone with an egg allergy.",
    verificationAdvice: "Look for halal certification, or ask the manufacturer to confirm the lysozyme is egg-derived and that no non-halal processing aids are involved. Note the egg-allergen implication.",
    commonUses: ["Hard and semi-hard cheeses (e.g. some Grana/Edam-type)", "Some beverages", "Occasionally other preserved foods"],
    labelNames: ["Lysozyme", "E1105", "Preservative (E1105)"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register or contact the manufacturer if you need to confirm the source and processing.",
    faqs: [
      { q: "Is E1105 (lysozyme) halal?", a: "It is usually from egg white, which most scholars accept, so it is generally treated as permissible. It is presented as doubtful because the source and processing aids are seldom stated — verify if you need certainty." },
      { q: "Is lysozyme from eggs?", a: "Yes, food lysozyme is usually extracted from hen egg white — which also makes it relevant for those with an egg allergy." },
      { q: "What names should I look for?", a: "'Lysozyme' or 'E1105'." },
    ],
    relatedCodes: ["E322", "E270", "E441"],
    sources: [efsaTopic("Lysozyme (E 1105) — food additive information", "Egg-white origin and use in cheese"), codexGsfa(), muisSource()],
    lastReviewed: REVIEWED,
  },
  { code: "E1400", name: "Modified starches (E1400–E1450)", category: "Thickener", status: "halal", origin: "Chemically/physically modified plant starch.", aliases: ["modified starch", "modified corn starch"] },
  {
    code: "E1510", name: "Ethanol (ethyl alcohol)", category: "Other", status: "haram",
    origin: "Drinking alcohol used as a carrier/solvent.",
    note: "Intoxicating alcohol is impermissible. Trace ethanol from natural fermentation is treated differently by scholars — but added ethanol is best avoided.",
    aliases: ["ethanol", "ethyl alcohol", "alcohol", "e1510"],
    insNumber: "1510",
    alternativeNames: ["Ethyl alcohol", "Ethanol", "Alcohol"],
    fn: "Carrier solvent / humectant",
    confidence: "high",
    originType: "synthetic",
    originSummary: "E1510 (Ethanol / ethyl alcohol) is drinking alcohol used as a carrier or solvent; intoxicating alcohol is impermissible, so added ethanol is treated as haram and best avoided.",
    description: "Ethanol is the alcohol found in alcoholic drinks. As a food additive (E1510) it is used as a solvent and carrier — for example to dissolve flavourings and colours — and as a humectant. It can be produced by fermentation or synthesis.",
    manufacturingSummary: "Produced by fermenting sugars or by chemical synthesis. In food it usually appears as a solvent for flavourings/colours or in glazes rather than as a drink.",
    halalReasoning: "Ethanol is the intoxicant in alcoholic drinks, and consuming intoxicating alcohol is impermissible — so deliberately added ethanol is treated as haram and best avoided. Scholars distinguish this from tiny traces of ethanol that form naturally (for example in bread, fruit juices or vinegar) and that do not intoxicate; views differ, and many treat unavoidable trace amounts as tolerated. Added ethanol as an ingredient, however, is the cautious 'avoid'.",
    verificationAdvice: "If a product lists ethanol/ethyl alcohol/alcohol as an added ingredient, treat it as doubtful-to-avoid unless it carries recognised halal certification. Contact the manufacturer if you need to know whether alcohol is present as a carrier in a flavouring.",
    commonUses: ["Flavouring and colour carriers", "Some glazes and coatings", "Vanilla and other extracts", "Confectionery and bakery (as a solvent)"],
    labelNames: ["Ethanol", "Ethyl alcohol", "Alcohol", "E1510"],
    singaporeGuidance: "In Singapore, verify the finished product on the MUIS HalalSG register; certified products are assessed against MUIS's alcohol rules. For an uncertified product listing alcohol/ethanol, treat it as doubtful and contact the manufacturer.",
    faqs: [
      { q: "Is E1510 (ethanol) halal?", a: "Ethanol is drinking alcohol; consuming intoxicating alcohol is impermissible, so added ethanol is treated as haram and best avoided." },
      { q: "What about trace alcohol in bread or juice?", a: "Scholars distinguish deliberately-added ethanol from tiny, non-intoxicating traces that form naturally in some foods; views differ, and many treat unavoidable traces as tolerated. Added ethanol as an ingredient is the cautious avoid." },
      { q: "Is alcohol in flavourings halal?", a: "Flavourings can use ethanol as a carrier. Where alcohol is added, treat it as doubtful-to-avoid unless the product is halal-certified; ask the manufacturer if unsure." },
      { q: "What names should I look for?", a: "'Ethanol', 'Ethyl alcohol', 'Alcohol' or 'E1510'." },
    ],
    relatedCodes: ["E422", "E150"],
    sources: [codexGsfa("INS 1510 (ethanol) as a carrier solvent"), muisSource("MUIS assesses alcohol content and use during certification")],
    lastReviewed: REVIEWED,
  },
  { code: "", name: "Rennet", category: "Other", status: "mushbooh", origin: "Enzyme used to make cheese; can be from animal stomach (halal only if from a halal animal), or microbial/plant (halal).", note: "Look for 'microbial rennet' or 'vegetarian rennet' — those are halal.", aliases: ["rennet", "cheese enzyme"] },
  { code: "", name: "Carmine (natural red 4)", category: "Colour", status: "haram", origin: "See E120 — insect-derived red colour.", aliases: ["carmine", "natural red 4"] },
];

/* Normalise a query for matching against code/name/aliases. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[\s.\-']/g, "");
}

/** Search additives by E-number, name or alias. Empty query → all. */
export function searchAdditives(query: string): Additive[] {
  const q = norm(query);
  if (!q) return ADDITIVES;
  return ADDITIVES.filter((a) => {
    if (a.code && norm(a.code).includes(q)) return true;
    // "471" should also match "E471"
    if (a.code && norm(a.code).replace(/^e/, "").includes(q.replace(/^e/, ""))) return true;
    if (norm(a.name).includes(q)) return true;
    return (a.aliases || []).some((al) => norm(al).includes(q));
  });
}

export const ADDITIVE_COUNT = ADDITIVES.length;
export function countByStatus(status: AdditiveStatus): number {
  return ADDITIVES.filter((a) => a.status === status).length;
}

/* ───────────────────────────────────────────────────────────────────────────
   Detail-page helpers — slugs, the quality gate, and lookups.
   Single source of truth used by the route, the sitemap and the redirect map so
   all three stay in lockstep.
   ─────────────────────────────────────────────────────────────────────────── */

/** kebab-case a string: lower-case, "&" → "and", non-alphanumerics → "-". */
function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Canonical, lowercase, human-readable detail-page slug.
    Pinned `slug` wins; else `<code>-<name>` (name-only entries slugify the name).
    Deterministic and stable — e.g. E104 → "e104-quinoline-yellow". */
export function ingredientSlug(a: Additive): string {
  if (a.slug) return a.slug;
  const namePart = kebab(a.name);
  return a.code ? `${a.code.toLowerCase()}-${namePart}` : namePart;
}

/** Alternative slugs that should 301 to the canonical slug (bare E-number +
    slugified aliases). Excludes the canonical slug itself. */
export function ingredientAltSlugs(a: Additive): string[] {
  const canonical = ingredientSlug(a);
  const alts = new Set<string>();
  if (a.code) alts.add(a.code.toLowerCase());
  for (const al of a.aliases || []) {
    const s = kebab(al);
    if (s) alts.add(s);
  }
  alts.delete(canonical);
  return [...alts];
}

/** Quality gate (PHASE 9): an entry earns an indexable detail page only with a
    unique direct answer + classification reasoning + origin/what-is-it +
    common uses or label guidance + verification advice + ≥1 source + a review
    date. Thin entries fail this and stay as accordion rows only. */
export function ingredientQualifies(a: Additive): boolean {
  if (a.indexable === false) return false;
  if (!a.code) return false; // name-only pointers duplicate a coded entry (e.g. Carmine → E120)
  const hasAnswer = !!a.halalReasoning && a.halalReasoning.trim().length > 40;
  const hasWhat = !!(a.description && a.description.trim().length > 40) || !!(a.originSummary && a.originSummary.trim().length > 40);
  const hasUses = !!(a.commonUses?.length || a.labelNames?.length);
  const hasVerify = !!(a.verificationAdvice || a.singaporeGuidance);
  const hasSource = !!(a.sources && a.sources.length >= 1);
  const hasReview = !!a.lastReviewed;
  return hasAnswer && hasWhat && hasUses && hasVerify && hasSource && hasReview;
}

/** All additives that have earned an indexable detail page. */
export function indexableIngredients(): Additive[] {
  return ADDITIVES.filter(ingredientQualifies);
}

/** Canonical-slug → additive, restricted to indexable entries. Unknown or thin
    slugs return undefined, so the route's notFound() covers both cases. */
const BY_SLUG: Map<string, Additive> = (() => {
  const m = new Map<string, Additive>();
  for (const a of ADDITIVES) if (ingredientQualifies(a)) m.set(ingredientSlug(a), a);
  return m;
})();

export function getIngredientBySlug(slug: string): Additive | undefined {
  return BY_SLUG.get(slug.toLowerCase());
}

/** Look up an additive by its exact E-number code (uppercase, e.g. "E120"). */
export function getAdditiveByCode(code: string): Additive | undefined {
  return ADDITIVES.find((a) => a.code === code);
}
