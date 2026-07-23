import { Rating } from "humblehalalsg";

export const WithReviews = () => (
  <div style={{ padding: 12 }}>
    <Rating value={4.8} count={312} />
  </div>
);

export const New = () => (
  <div style={{ padding: 12 }}>
    <Rating value={0} count={0} />
  </div>
);

export const StarOnly = () => (
  <div style={{ padding: 12 }}>
    <Rating value={4.4} showCount={false} />
  </div>
);

export const AcrossListings = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 12, maxWidth: 320 }}>
    {[
      { name: "Warung Bumbu Rempah", value: 4.8, count: 312 },
      { name: "Qahwa & Co.", value: 4.6, count: 184 },
      { name: "Tok Tok Mee Pok House", value: 4.4, count: 96 },
      { name: "Dapur Nenek (Bugis)", value: 0, count: 0 },
    ].map((l) => (
      <div key={l.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{l.name}</span>
        <Rating value={l.value} count={l.count} />
      </div>
    ))}
  </div>
);
