import { ListingCard, PreviewShell, sampleListings } from "humblehalalsg";

export const Standard = () => (
  <PreviewShell>
    <div style={{ maxWidth: 340 }}>
      <ListingCard item={sampleListings[0]} />
    </div>
  </PreviewShell>
);

export const Featured = () => (
  <PreviewShell>
    <div style={{ maxWidth: 340 }}>
      <ListingCard item={sampleListings[1]} variant="featured" />
    </div>
  </PreviewShell>
);

export const Row = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <ListingCard item={sampleListings[2]} variant="row" />
    </div>
  </PreviewShell>
);
