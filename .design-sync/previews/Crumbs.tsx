import { Crumbs } from "humblehalalsg";

export const TravelTrail = () => (
  <Crumbs
    trail={[
      { label: "Home", href: "/" },
      { label: "Travel", href: "/travel" },
      { label: "Kuala Lumpur" },
    ]}
  />
);

export const HotelTrail = () => (
  <Crumbs
    trail={[
      { label: "Home", href: "/" },
      { label: "Travel", href: "/travel" },
      { label: "Kuala Lumpur", href: "/travel/kuala-lumpur" },
      { label: "Anjung Suites" },
    ]}
  />
);

export const UmrahTrail = () => (
  <Crumbs
    trail={[
      { label: "Home", href: "/" },
      { label: "Umrah", href: "/travel/umrah" },
      { label: "Mecca" },
    ]}
  />
);
