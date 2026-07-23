import { CategoryChips } from "humblehalalsg";

export const AllCategories = () => (
  <div style={{ maxWidth: 720 }}>
    <CategoryChips />
  </div>
);

export const CuisinesActive = () => (
  <div style={{ maxWidth: 720 }}>
    <CategoryChips activeSlug="cuisines" />
  </div>
);

export const RestaurantsActive = () => (
  <div style={{ maxWidth: 720 }}>
    <CategoryChips activeSlug="restaurants-cafes" />
  </div>
);
