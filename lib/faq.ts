/* Answer-first FAQ content — surfaced visibly AND as FAQPage schema.
   Written to be citable by AI answer engines (clear definitions, SG-specific). */
export interface QA {
  q: string;
  a: string;
}

export const HOME_FAQ: QA[] = [
  {
    q: "Is the food listed on Humble Halal halal certified?",
    a: "Not all of it, and we make the difference unmistakable. Listings marked “MUIS Certified” or “Admin Verified” have been officially certified or document-checked. Listings marked “Halal-Friendly” or “No Pork No Lard” are self-declared by the business and are explicitly labelled “not certified.” Always confirm certification on the official MUIS HalalSG register.",
  },
  {
    q: "What does MUIS Certified mean in Singapore?",
    a: "MUIS (Majlis Ugama Islam Singapura) is Singapore’s official Islamic authority and the only body that issues halal certification. A MUIS Certified badge on Humble Halal means the establishment holds a valid MUIS halal certificate, and we link to its HalalSG verification.",
  },
  {
    q: "How do I find halal food near me in Singapore?",
    a: "Open the map view and tap “Near me” to sort halal restaurants, cafés and Muslim-owned businesses by distance from your location. You can also browse by area (Tampines, Bugis, Geylang Serai, Bedok and more) or filter by prayer space, family-friendly and open-now.",
  },
  {
    q: "Is Humble Halal a halal certifier?",
    a: "No. Humble Halal is a discovery and directory platform, not a certifier. We surface official certification status and link to MUIS HalalSG, but we do not issue halal certificates ourselves.",
  },
  {
    q: "Do these places have prayer spaces?",
    a: "Many do. Listings with a prayer space show details such as gender arrangement, wudhu (ablution) facilities, capacity and whether mats or telekung are provided. The prayer-times strip also shows the nearest mosque.",
  },
];

export const VERIFY_FAQ: QA[] = [
  {
    q: "What is the difference between MUIS Certified and Halal-Friendly on Humble Halal?",
    a: "MUIS Certified means the business holds an official MUIS halal certificate (we link to HalalSG to verify). Halal-Friendly is a self-declaration by the business that it serves halal-friendly food, and it is explicitly labelled “not certified.” The visual badge styles are deliberately different so the distinction is never ambiguous.",
  },
  {
    q: "What does “Admin Verified” mean?",
    a: "Admin Verified means the Humble Halal team has reviewed supporting documents (such as a business registration or certificate) for a Muslim-owned business that may not carry MUIS certification. It is a trust signal, not a substitute for MUIS halal certification.",
  },
  {
    q: "How often is certification re-checked?",
    a: "Certified listings show a “last verified” date, certificate number and expiry. Where a listing’s halal status has recently changed, we flag it so you can re-confirm before visiting.",
  },
  {
    q: "How can I report an incorrect halal status?",
    a: "Every listing has a “Report incorrect info” option. You can flag a wrong halal status, closed business, wrong hours or changed ownership, and our team reviews it.",
  },
];
