import { CategoryButton } from "humblehalalsg";

export const Restaurants = () => (
  <div style={{ width: 120 }}>
    <CategoryButton cat={{ icon: "utensils", label: "Restaurants" }} onClick={() => {}} />
  </div>
);

export const Grid = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 480 }}>
    {[
      { icon: "utensils", label: "Restaurants" },
      { icon: "coffee", label: "Cafés" },
      { icon: "basket", label: "Groceries" },
      { icon: "store", label: "Bakeries" },
      { icon: "sparkles", label: "Beauty & Spa" },
      { icon: "mosque", label: "Prayer Rooms" },
      { icon: "bed", label: "Halal Stays" },
      { icon: "calendar", label: "Caterers" },
    ].map((c) => (
      <CategoryButton key={c.label} cat={c} onClick={() => {}} />
    ))}
  </div>
);
