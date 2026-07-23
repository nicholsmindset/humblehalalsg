import { SectionHead } from "humblehalalsg";

export const WithAction = () => (
  <div style={{ maxWidth: 520, padding: 12 }}>
    <SectionHead title="Featured in Geylang Serai" action="See all" onAction={() => {}} />
  </div>
);

export const NoAction = () => (
  <div style={{ maxWidth: 520, padding: 12 }}>
    <SectionHead title="Popular halal categories" />
  </div>
);

export const NewThisWeek = () => (
  <div style={{ maxWidth: 520, padding: 12 }}>
    <SectionHead title="New this week in Tampines" action="Browse all" onAction={() => {}} />
  </div>
);
