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
  { code: "E101", name: "Riboflavin (Vitamin B2)", category: "Colour", status: "mushbooh", origin: "Yellow colour/vitamin; can be produced from microbial fermentation or animal-derived media.", note: "Synthetic and fermentation-based versions are halal — check the source." },

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

  { code: "E124", name: "Ponceau 4R", category: "Colour", status: "halal", origin: "Synthetic azo dye." },
  { code: "E127", name: "Erythrosine", category: "Colour", status: "halal", origin: "Synthetic dye." },

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

  { code: "E132", name: "Indigo Carmine", category: "Colour", status: "halal", origin: "Synthetic dye (despite the name, not from insects)." },
  { code: "E140", name: "Chlorophyll", category: "Colour", status: "halal", origin: "Green colour from plants." },
  { code: "E150", name: "Caramel colour", category: "Colour", status: "mushbooh", origin: "Made by heating sugars; usually halal, but some processes may use trace alcohol or ammonia.", note: "Plain caramel (E150a) is generally halal; verify if avoiding all alcohol traces." },
  { code: "E153", name: "Vegetable carbon", category: "Colour", status: "mushbooh", origin: "Black colour from charred plant matter — but 'carbon black' can also be animal bone char.", note: "Confirm it is vegetable-sourced, not bone char." },
  { code: "E160a", name: "Beta-carotene", category: "Colour", status: "mushbooh", origin: "Orange colour; the colour itself is plant/synthetic, but it is often stabilised in a gelatine carrier.", note: "Gelatine-free (e.g. starch-encapsulated) versions are halal." },
  { code: "E160b", name: "Annatto", category: "Colour", status: "halal", origin: "Orange colour from annatto seeds — plant-derived." },
  { code: "E160c", name: "Paprika extract", category: "Colour", status: "halal", origin: "From paprika/peppers — plant-derived." },
  { code: "E162", name: "Beetroot Red (Betanin)", category: "Colour", status: "halal", origin: "Red colour from beetroot — plant-derived.", aliases: ["betanin"] },
  { code: "E163", name: "Anthocyanins", category: "Colour", status: "halal", origin: "Purple/red colours from fruits and vegetables." },
  { code: "E170", name: "Calcium carbonate", category: "Colour", status: "halal", origin: "Mineral (chalk)." },
  { code: "E171", name: "Titanium dioxide", category: "Colour", status: "halal", origin: "White mineral pigment.", note: "Banned as a food additive in some countries for safety reasons — that is separate from its halal status." },
  { code: "E172", name: "Iron oxides & hydroxides", category: "Colour", status: "halal", origin: "Mineral pigments." },

  // ── Preservatives ────────────────────────────────────────────────────────
  { code: "E200", name: "Sorbic acid", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
  { code: "E202", name: "Potassium sorbate", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
  { code: "E210", name: "Benzoic acid", category: "Preservative", status: "halal", origin: "Synthetic/plant preservative." },
  { code: "E211", name: "Sodium benzoate", category: "Preservative", status: "halal", origin: "Synthetic preservative." },
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
  { code: "E260", name: "Acetic acid", category: "Preservative", status: "mushbooh", origin: "Vinegar acid; halal when synthetic or from halal vinegar, but can be derived from wine vinegar.", note: "Vinegar from wine is treated as halal by many scholars once fully converted; confirm if strict." },
  { code: "E270", name: "Lactic acid", category: "Preservative", status: "halal", origin: "Usually made by bacterial fermentation of plant sugars.", note: "Very rarely uses dairy; generally accepted as halal." },
  { code: "E280", name: "Propionic acid", category: "Preservative", status: "halal", origin: "Synthetic preservative." },

  // ── Antioxidants ───────────────────────────────────────────────────────────
  { code: "E300", name: "Ascorbic acid (Vitamin C)", category: "Antioxidant", status: "halal", origin: "Synthetic/plant vitamin C.", aliases: ["vitamin c"] },
  { code: "E301", name: "Sodium ascorbate", category: "Antioxidant", status: "halal", origin: "Salt of Vitamin C." },
  { code: "E304", name: "Ascorbyl palmitate", category: "Antioxidant", status: "mushbooh", origin: "Vitamin C bonded to palmitic acid — the palmitate can be animal- or plant-derived.", note: "Plant-derived versions are halal." },
  { code: "E306", name: "Tocopherols (Vitamin E)", category: "Antioxidant", status: "mushbooh", origin: "Usually extracted from vegetable oils, but the carrier oil source can vary.", note: "Most commercial Vitamin E is soy-derived (halal); confirm if strict.", aliases: ["vitamin e", "tocopherol"] },

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
  { code: "E330", name: "Citric acid", category: "Acidity regulator", status: "halal", origin: "Made by fermentation of sugars — plant-based.", aliases: ["sour salt"] },
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
  { code: "E422", name: "Glycerol / Glycerine", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Can be from plant oils, synthetic, or animal fat.", note: "Plant/synthetic glycerine is halal; animal-fat glycerine is not unless from halal animals.", aliases: ["glycerin", "glycerine", "glycerol"] },

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

  { code: "E472e", name: "Mono/diacetyl tartaric acid esters (DATEM)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Ester of glycerides whose fat source can be animal or plant.", aliases: ["datem", "e472"] },
  { code: "E475", name: "Polyglycerol esters of fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid esters; source can be animal or plant." },
  { code: "E476", name: "Polyglycerol polyricinoleate (PGPR)", category: "Emulsifier & stabiliser", status: "halal", origin: "Made from castor oil — plant-derived.", aliases: ["pgpr"] },
  { code: "E481", name: "Sodium stearoyl-2-lactylate (SSL)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Stearoyl (fatty acid) source can be animal or plant.", aliases: ["ssl"] },
  { code: "E482", name: "Calcium stearoyl-2-lactylate (CSL)", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Stearoyl (fatty acid) source can be animal or plant.", aliases: ["csl"] },
  { code: "E491", name: "Sorbitan monostearate", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid ester; source can be animal or plant." },

  // ── Anti-caking & minerals ─────────────────────────────────────────────────
  { code: "E500", name: "Sodium bicarbonate (baking soda)", category: "Acidity regulator", status: "halal", origin: "Mineral salt.", aliases: ["baking soda", "bicarbonate of soda"] },
  { code: "E501", name: "Potassium carbonate", category: "Acidity regulator", status: "halal", origin: "Mineral salt." },
  { code: "E508", name: "Potassium chloride", category: "Other", status: "halal", origin: "Mineral salt." },
  { code: "E509", name: "Calcium chloride", category: "Other", status: "halal", origin: "Mineral salt." },
  { code: "E524", name: "Sodium hydroxide", category: "Acidity regulator", status: "halal", origin: "Alkali (lye) — mineral/chemical." },
  { code: "E542", name: "Bone phosphate (edible)", category: "Anti-caking", status: "mushbooh", origin: "Made from animal bones — the animal source is usually unspecified.", note: "Halal only if from halal-slaughtered animals; mineral phosphates (E341) are a halal alternative.", aliases: ["bone phosphate"] },
  { code: "E551", name: "Silicon dioxide", category: "Anti-caking", status: "halal", origin: "Mineral (silica).", aliases: ["silica"] },
  { code: "E570", name: "Stearic acid / Fatty acids", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty acid that can be animal- or plant-derived." },
  { code: "E572", name: "Magnesium stearate", category: "Emulsifier & stabiliser", status: "mushbooh", origin: "Fatty-acid salt; source can be animal or plant." },
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

  { code: "E627", name: "Disodium guanylate", category: "Flavour enhancer", status: "mushbooh", origin: "Flavour enhancer that can be derived from yeast, fish, or meat.", note: "Often paired with E631; the animal/fish source is usually unstated." },

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

  { code: "E635", name: "Disodium 5'-ribonucleotides", category: "Flavour enhancer", status: "mushbooh", origin: "Blend of E627/E631; source can be animal, fish or microbial." },
  { code: "E640", name: "Glycine & sodium glycinate", category: "Flavour enhancer", status: "mushbooh", origin: "Amino acid that can be synthetic or animal-derived." },

  // ── Glazing, waxes & flour treatment ───────────────────────────────────────
  { code: "E901", name: "Beeswax", category: "Glazing & wax", status: "halal", origin: "Produced by honeybees — generally permissible, like honey." },
  { code: "E903", name: "Carnauba wax", category: "Glazing & wax", status: "halal", origin: "From the carnauba palm — plant-derived." },
  { code: "E904", name: "Shellac", category: "Glazing & wax", status: "mushbooh", origin: "Resin secreted by the lac insect.", note: "Scholars differ — some permit it as a secretion (like honey), others avoid it as insect-derived." },
  { code: "E920", name: "L-Cysteine", category: "Flour treatment", status: "mushbooh", origin: "Dough conditioner that can be made from human hair, duck/chicken feathers, or synthetically.", note: "Synthetic and microbial L-cysteine is halal; feather/hair-derived is doubtful.", aliases: ["cysteine", "e920"] },

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
  { code: "E1105", name: "Lysozyme", category: "Preservative", status: "mushbooh", origin: "Enzyme usually extracted from egg white.", note: "Halal if the egg source is acceptable; some avoid due to processing aids." },
  { code: "E1400", name: "Modified starches (E1400–E1450)", category: "Thickener", status: "halal", origin: "Chemically/physically modified plant starch.", aliases: ["modified starch", "modified corn starch"] },
  { code: "E1510", name: "Ethanol (ethyl alcohol)", category: "Other", status: "haram", origin: "Drinking alcohol used as a carrier/solvent.", note: "Intoxicating alcohol is impermissible. Trace ethanol from natural fermentation is treated differently by scholars — but added ethanol is best avoided.", aliases: ["ethanol", "ethyl alcohol", "alcohol"] },
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
