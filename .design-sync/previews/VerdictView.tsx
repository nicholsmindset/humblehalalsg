import { VerdictView } from "humblehalalsg";

export const LikelyHalal = () => (
  <VerdictView
    v={{
      slug: "lays-classic-potato-chips",
      page_type: "brand",
      name: "Lay's Classic Potato Chips",
      h1: "Are Lay's Classic Potato Chips Halal in Singapore?",
      verdict: "likely",
      confidence: "medium",
      verdict_label: "Likely halal — with conditions",
      cert_status: "No MUIS certification found",
      one_line_answer:
        "Lay's Classic (salted) potato chips contain no obvious haram ingredients, but the packs sold in Singapore are not MUIS halal-certified — check the pack for a recognised halal mark.",
      confidence_explainer:
        "The plain salted variant is potato, vegetable oil and salt, but flavour seasonings and the manufacturing line are not independently verified for the Singapore market.",
      date_reviewed: "18 July 2026",
      why_verdict: [
        "The Classic (salted) recipe is potato fried in vegetable oil with salt — none of which is haram in itself.",
        "However, no MUIS halal certificate covers the packs sold in Singapore, and flavoured variants can carry animal-derived or alcohol-based seasonings.",
      ],
      ingredient_table: [
        { name: "Potatoes", status: "halal", note: "Plant" },
        { name: "Vegetable oil", status: "halal", note: "Sunflower / palm" },
        { name: "Seasoning (flavoured variants)", status: "unknown", note: "May be animal-derived — check the pack" },
      ],
      look_for: [
        { icon: "🔎", text: "A recognised halal mark printed on the specific pack." },
        { icon: "🌍", text: "Country of manufacture — some plants run halal-certified lines." },
      ],
      alternatives: ["Halal-certified potato crisps (check the pack)", "Fresh-cut fries from a MUIS-certified outlet"],
      official_sources: [
        {
          body: "MUIS HalalSG",
          claim: "No certification listing found for this product in Singapore.",
          url: "https://www.muis.gov.sg/halal",
        },
      ],
      scholarly_views: [],
      internal_links: { related_checks: ["pringles-original", "twisties-cheese"], cross_sell: [] },
      faq_answer: null,
    }}
  />
);

export const Mashbooh = () => (
  <VerdictView
    v={{
      slug: "e120-carmine",
      page_type: "ingredient",
      name: "Carmine (E120)",
      h1: "Is Carmine (E120) Halal?",
      verdict: "mashbooh",
      confidence: "high",
      verdict_label: "Mashbooh — doubtful",
      cert_status: "Insect-derived colour",
      one_line_answer:
        "Carmine (E120, cochineal) is a red colour extracted from the cochineal insect. Scholars differ on insect-derived additives, so it is treated as mashbooh (doubtful) unless a halal plant alternative is used.",
      confidence_explainer:
        "The source is well-documented (cochineal insect) — the doubt is a genuine difference in scholarly ruling, not uncertainty about the ingredient, so confidence is high while the verdict stays mashbooh.",
      date_reviewed: "18 July 2026",
      why_verdict: [
        "Carmine is produced from the dried bodies of the cochineal insect (Dactylopius coccus), giving a stable crimson colour.",
        "Whether insect-derived additives are permissible is a genuine point of difference between schools, so we present both views rather than issue a single ruling.",
      ],
      ingredient_table: [
        { name: "Cochineal extract", status: "mushbooh", note: "Insect-derived" },
        { name: "Aluminium substrate (lake)", status: "halal", note: "Mineral carrier" },
      ],
      look_for: [
        { icon: "🏷️", text: "'Carmine', 'cochineal', 'E120' or 'Natural Red 4' on the label." },
        { icon: "🌿", text: "Plant-based reds (beetroot E162, anthocyanins E163) as a substitute." },
      ],
      alternatives: ["Beetroot red (E162)", "Paprika extract (E160c)", "Anthocyanins (E163)"],
      official_sources: [
        {
          body: "MUIS HalalSG",
          claim: "Verify the finished product's certification on the register.",
          url: "https://www.muis.gov.sg/halal",
        },
        {
          body: "EFSA",
          claim: "Cochineal, carminic acid, carmines (E120) re-evaluation of safety.",
          url: "https://www.efsa.europa.eu",
        },
      ],
      scholarly_views: [
        {
          view: "Permissible view",
          position:
            "Some scholars hold that insects without flowing blood, and the small colouring quantities involved, make carmine permissible as a food colour.",
        },
        {
          view: "Cautious view",
          position:
            "Others treat insect-derived additives as doubtful or impermissible and advise choosing a plant-based colour where one is available.",
        },
      ],
      internal_links: { related_checks: ["e100-curcumin", "e162-beetroot-red"], cross_sell: [] },
      faq_answer: null,
    }}
  />
);
