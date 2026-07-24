import { BlogCard } from "humblehalalsg";

const restaurants = {
  slug: "best-halal-restaurants-singapore-2026",
  title: "Best Halal Restaurants in Singapore (2026)",
  dek: "From Nasi Padang heritage to halal steak and fine dining — how to find genuinely great, certified halal restaurants across the island.",
  readMins: 9,
  datePublished: "2026-06-11",
  image: "",
  imageAlt: "A Nasi Padang spread of rendang, sambal goreng and rice",
  category: "restaurants-cafes",
  tags: ["Restaurants", "Food guides", "Best of"],
};

const travel = {
  slug: "muslim-friendly-hotels-kuala-lumpur",
  title: "Muslim-Friendly Hotels in Kuala Lumpur",
  dek: "Prayer rooms, halal breakfasts and surau-equipped stays — where Muslim families from Singapore should book in KL.",
  readMins: 7,
  datePublished: "2026-05-28",
  image: "",
  imageAlt: "Kuala Lumpur skyline at dusk with the Petronas Towers",
  category: "muslim-travel",
  tags: ["Muslim Travel", "Hotels"],
};

export const Default = () => (
  <div style={{ maxWidth: 360 }}>
    <BlogCard post={restaurants} />
  </div>
);

export const TravelPost = () => (
  <div style={{ maxWidth: 360 }}>
    <BlogCard post={travel} />
  </div>
);

export const IndexHeading = () => (
  <div style={{ maxWidth: 360 }}>
    <BlogCard post={restaurants} headingLevel="h2" priority />
  </div>
);
