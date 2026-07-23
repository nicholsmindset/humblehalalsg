import { Empty } from "humblehalalsg";

export const NoResults = () => (
  <Empty
    icon="search"
    title="No halal spots found"
    body="We couldn't find anything for “Nasi Padang in Punggol”. Try a nearby area or a different cuisine."
    action="Clear filters"
    onAction={() => {}}
  />
);

export const NoSaved = () => (
  <Empty
    icon="heart"
    title="No saved places yet"
    body="Tap the heart on any listing to keep it here for your next makan run."
  />
);

export const NoReviews = () => (
  <Empty
    icon="sparkles"
    title="Be the first to review"
    body="No one has reviewed Tok Tok Mee Pok House yet. Share your experience to help other diners."
    action="Write a review"
    onAction={() => {}}
  />
);
