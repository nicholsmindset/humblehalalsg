import { SimilarChecks } from "humblehalalsg";

const CHECKED = "July 2026";
const SOURCE = "MUIS HalalSG register + publicly available information";

export const FastFood = () => (
  <div style={{ maxWidth: 560 }}>
    <SimilarChecks
      category="Fast food"
      items={[
        {
          slug: "burger-king", brand: "Burger King", category: "Fast food",
          status: "certified", lastChecked: CHECKED, source: SOURCE,
          answer: "Yes — Burger King Singapore is MUIS halal-certified chain-wide.",
        },
        {
          slug: "mos-burger", brand: "MOS Burger", category: "Fast food",
          status: "no-pork", lastChecked: CHECKED, source: SOURCE,
          answer: "MOS Burger Singapore serves no pork or lard but holds no MUIS certification.",
        },
        {
          slug: "shake-shack", brand: "Shake Shack", category: "Burgers",
          status: "not-certified", lastChecked: CHECKED, source: SOURCE,
          answer: "Shake Shack is not MUIS halal-certified in Singapore and has said it does not intend to be.",
        },
      ]}
    />
  </div>
);

export const Bakery = () => (
  <div style={{ maxWidth: 560 }}>
    <SimilarChecks
      category="Bakery"
      items={[
        {
          slug: "swee-heng", brand: "Swee Heng", category: "Bakery",
          status: "certified", lastChecked: CHECKED, source: SOURCE,
          answer: "Yes — Swee Heng Bakery is MUIS halal-certified across its Singapore outlets.",
        },
        {
          slug: "cedele", brand: "Cedele", category: "Bakery & café",
          status: "no-pork", lastChecked: CHECKED, source: SOURCE,
          answer: "Cedele uses no pork or lard but has not applied for MUIS certification.",
        },
        {
          slug: "breadtalk", brand: "BreadTalk", category: "Bakery",
          status: "not-certified", lastChecked: CHECKED, source: SOURCE,
          answer: "BreadTalk is not MUIS halal-certified — some products contain pork floss.",
        },
      ]}
    />
  </div>
);
