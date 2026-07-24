import { Faq } from "humblehalalsg";

const items = [
  {
    q: "What does “MUIS Certified” mean on Humble Halal?",
    a: "It means the outlet holds a valid halal certificate from MUIS (Majlis Ugama Islam Singapura), Singapore's official Islamic authority. We link to its HalalSG listing so you can verify it yourself.",
  },
  {
    q: "How is “Muslim-owned” different from “Halal-certified”?",
    a: "Muslim-owned describes who runs the business; halal-certified describes an audited kitchen. A Muslim-owned café can be uncertified, and a certified stall can have non-Muslim owners — we label both clearly so there's no confusion.",
  },
  {
    q: "Does “No Pork No Lard” mean the food is halal?",
    a: "No. “No Pork No Lard” is a self-declaration, not a certification. It's explicitly marked as not certified — always confirm on the MUIS HalalSG register before you order.",
  },
  {
    q: "How do I find halal food near me?",
    a: "Open the map and tap “Near me” to sort halal restaurants, cafés and Muslim-owned businesses by distance, or browse by area — Tampines, Bugis, Geylang Serai and more.",
  },
];

export const Default = () => <Faq items={items.slice(0, 3)} />;

export const TwoColumn = () => (
  <Faq
    items={items}
    eyebrow="Halal, verified"
    title="Certification questions, answered"
    columns={2}
  />
);
