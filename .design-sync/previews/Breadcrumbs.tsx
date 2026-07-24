import { Breadcrumbs, PreviewShell } from "humblehalalsg";

export const ListingTrail = () => (
  <PreviewShell>
    <Breadcrumbs
      items={[
        { name: "Home", screen: "home" },
        { name: "Restaurants", screen: "explore", params: { cat: "restaurants" } },
        { name: "Tampines", screen: "explore", params: { area: "tampines" } },
        { name: "Warung Bumbu Rempah" },
      ]}
    />
  </PreviewShell>
);

export const AreaTrail = () => (
  <PreviewShell>
    <Breadcrumbs
      items={[
        { name: "Home", screen: "home" },
        { name: "Halal food by area", screen: "explore" },
        { name: "Geylang Serai" },
      ]}
    />
  </PreviewShell>
);

export const HawkerTrail = () => (
  <PreviewShell>
    <Breadcrumbs
      items={[
        { name: "Home", screen: "home" },
        { name: "Hawker", screen: "hawker" },
        { name: "Tampines Round Market", screen: "hawker", params: { id: "tampines-round-market" } },
        { name: "Sedap Corner Nasi Lemak" },
      ]}
    />
  </PreviewShell>
);
