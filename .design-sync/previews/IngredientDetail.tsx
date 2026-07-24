import { IngredientDetail } from "humblehalalsg";

export const Doubtful = () => (
  <IngredientDetail
    a={{
      code: "E471",
      name: "Mono- and Diglycerides of Fatty Acids",
      category: "Emulsifier & stabiliser",
      status: "mushbooh",
      origin: "Glycerol combined with fatty acids that may be plant- or animal-derived",
      originSummary:
        "E471 is an emulsifier made from glycerol and fatty acids. Those fatty acids can come from plant oils or from animal fat — and the label rarely says which — so it is treated as doubtful (mushbooh) until the source is confirmed.",
      halalReasoning:
        "When E471 is made from plant oils (e.g. palm or soybean) it is halal. When it is made from animal fat it is only halal if that animal was slaughtered Islamically. Because manufacturers can switch sources and the label does not disclose the origin, the conservative default is mushbooh — verify the specific product.",
      alternativeNames: ["E471", "Mono- and diglycerides", "Glycerol monostearate", "GMS"],
      aliases: ["mono and diglycerides", "gms", "471"],
      fn: "Emulsifier",
      confidence: "high",
      originType: "variable",
      insNumber: "471",
      description:
        "E471 is one of the most common emulsifiers in packaged food — it helps oil and water stay mixed, keeps bread soft and stops ice cream from separating.",
      manufacturingSummary:
        "It is produced by reacting glycerol with fatty acids sourced from vegetable oils or animal fats, then refining the result into a waxy emulsifier.",
      commonUses: [
        "Bread, cakes and other baked goods",
        "Ice cream and margarine",
        "Instant noodles",
        "Chocolate and confectionery",
        "Non-dairy creamers",
      ],
      labelNames: ["E471", "Mono- and diglycerides of fatty acids", "Emulsifier (471)", "Glycerol monostearate"],
      singaporeGuidance:
        "A product carrying MUIS halal certification will have had its E471 source verified — so a MUIS-certified product with E471 is fine. For uncertified imports, contact the manufacturer to confirm the fatty-acid source.",
      healthSummary:
        "E471 is considered safe by food-safety authorities at normal dietary levels; it is a digestible fat-based emulsifier, not a preservative.",
      regulatorySummary:
        "Permitted in the EU, the UK and by Codex as a food additive with an acceptable daily intake 'not specified'.",
      faqs: [
        {
          q: "Is E471 always from pork?",
          a: "No. E471 is more often made from plant oils such as palm or soy. It can be animal-derived, which is why it is treated as doubtful unless the source is confirmed — it is not automatically pork.",
        },
        {
          q: "Can I eat E471 in a MUIS-certified product?",
          a: "Yes. If the finished product is MUIS halal-certified, the source of its E471 has already been verified as acceptable. The doubt only applies to uncertified products.",
        },
      ],
      relatedCodes: ["E322", "E472e", "E120"],
      sources: [
        {
          title: "Mono- and di-glycerides of fatty acids (E471) re-evaluation",
          organisation: "European Food Safety Authority (EFSA)",
          url: "https://www.efsa.europa.eu",
          sourceType: "regulatory",
          accessedDate: "2026-07-18",
          supports: "Origin and safety",
        },
        {
          title: "Halal Certification — HalalSG",
          organisation: "Majlis Ugama Islam Singapura (MUIS)",
          url: "https://www.muis.gov.sg/halal",
          sourceType: "certification",
          accessedDate: "2026-07-18",
          supports: "Singapore verification process",
        },
      ],
      lastReviewed: "2026-07-18",
    }}
  />
);

export const GenerallyHalal = () => (
  <IngredientDetail
    a={{
      code: "E330",
      name: "Citric Acid",
      category: "Acidity regulator",
      status: "halal",
      origin: "Produced by microbial fermentation of sugars",
      originSummary:
        "Citric acid (E330) is almost always made by fermenting sugar with the mould Aspergillus niger — a microbial process with no animal input — so it is generally halal.",
      halalReasoning:
        "Commercial citric acid is produced by fermentation of carbohydrate (usually glucose or molasses) using Aspergillus niger, not extracted from citrus fruit or any animal source. The process involves no alcohol and no animal-derived material, so it is considered halal.",
      alternativeNames: ["E330", "Citric acid", "2-hydroxypropane-1,2,3-tricarboxylic acid"],
      aliases: ["citric acid", "330", "sour salt"],
      fn: "Acidity regulator / antioxidant",
      confidence: "high",
      originType: "microbial",
      insNumber: "330",
      description:
        "Citric acid is the tart, sour additive behind the sharp taste of soft drinks and sweets. It also works as a preservative and antioxidant by controlling acidity.",
      manufacturingSummary:
        "Industrial citric acid is made by feeding sugar to the mould Aspergillus niger in large fermentation tanks, then filtering and crystallising the acid.",
      commonUses: [
        "Soft drinks and cordials",
        "Sweets and sour candies",
        "Jams and canned fruit",
        "Sauces and marinades",
        "Effervescent tablets",
      ],
      labelNames: ["E330", "Citric acid", "Acidity regulator (330)"],
      singaporeGuidance:
        "Citric acid is widely accepted as halal; a MUIS-certified product containing E330 needs no further checking. The additive itself does not affect a product's halal status.",
      healthSummary:
        "Citric acid occurs naturally in citrus fruit and is recognised as safe; it is a common, well-tolerated food acid.",
      regulatorySummary:
        "Permitted worldwide with an acceptable daily intake 'not specified' (EU, UK FSA, Codex).",
      faqs: [
        {
          q: "Is citric acid made from lemons?",
          a: "Not commercially. Although it is named after citrus, food-grade citric acid is produced by fermenting sugar with a mould, not squeezed from fruit — the result is the same molecule.",
        },
        {
          q: "Does citric acid contain alcohol?",
          a: "No. The fermentation produces citric acid, not ethanol, and the final ingredient contains no alcohol.",
        },
      ],
      relatedCodes: ["E300", "E296", "E331"],
      sources: [
        {
          title: "Citric acid (E330) — food additive information",
          organisation: "UK Food Standards Agency (FSA)",
          url: "https://www.food.gov.uk",
          sourceType: "regulatory",
          accessedDate: "2026-07-18",
          supports: "Origin and safety",
        },
        {
          title: "Halal Certification — HalalSG",
          organisation: "Majlis Ugama Islam Singapura (MUIS)",
          url: "https://www.muis.gov.sg/halal",
          sourceType: "certification",
          accessedDate: "2026-07-18",
          supports: "Singapore verification process",
        },
      ],
      lastReviewed: "2026-07-18",
    }}
  />
);
