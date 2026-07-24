import { StatusCard } from "humblehalalsg";

const CHECKED = "July 2026";
const SOURCE = "MUIS HalalSG register + publicly available information";

export const Certified = () => (
  <div style={{ maxWidth: 460 }}>
    <StatusCard
      b={{
        slug: "mcdonalds",
        brand: "McDonald's",
        category: "Fast food",
        status: "certified",
        certifiedSince: "1992",
        lastChecked: CHECKED,
        source: SOURCE,
        answer:
          "Yes — every McDonald's restaurant in Singapore is MUIS halal-certified, and has been since 1992; this covers McCafé and dessert kiosks too. Certificates are renewed periodically, so confirm any outlet's current status on the MUIS HalalSG register.",
        whyStatus: [
          "Every McDonald's restaurant in Singapore holds a current MUIS halal certificate — one of the longest-running certifications in local fast food.",
          "Coverage includes McCafé counters and dessert kiosks, stated on McDonald's own customer-care pages.",
        ],
      }}
    />
  </div>
);

export const NoPork = () => (
  <div style={{ maxWidth: 460 }}>
    <StatusCard
      b={{
        slug: "genki-sushi",
        brand: "Genki Sushi",
        category: "Sushi restaurant",
        status: "no-pork",
        lastChecked: CHECKED,
        source: SOURCE,
        answer:
          "Genki Sushi Singapore is not MUIS halal-certified. The chain states its menu uses no pork and no lard, but some sauces contain mirin and it cannot guarantee against cross-contamination. 'No pork, no lard' is self-declared and is not halal certification — verify on MUIS HalalSG.",
        whyStatus: [
          "Genki Sushi states its menu uses no pork and no lard, but holds no MUIS certification.",
          "Some sauces contain mirin (a rice wine), and the chain says it cannot guarantee against cross-contamination.",
        ],
      }}
    />
  </div>
);

export const NotCertified = () => (
  <div style={{ maxWidth: 460 }}>
    <StatusCard
      b={{
        slug: "saizeriya",
        brand: "Saizeriya",
        category: "Italian restaurant",
        status: "not-certified",
        lastChecked: CHECKED,
        source: SOURCE,
        answer:
          "Saizeriya is not halal in Singapore. The menu includes pork and wine, and its outlets are not on the MUIS HalalSG register. It is not suitable for halal-conscious diners.",
        whyStatus: [
          "Saizeriya's menu includes pork dishes and wine, and its outlets are not on the MUIS HalalSG register.",
          "Pork appears across the menu (cutlets, pizzas, dorias) and wine is served — this is not a borderline case.",
        ],
      }}
    />
  </div>
);
