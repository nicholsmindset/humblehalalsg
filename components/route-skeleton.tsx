/* Lightweight, server-rendered route skeletons shown by each route's loading.tsx
   while its payload streams in. Reuses the existing .skeleton shimmer + .hh-wrap
   container so the placeholder lines up with the real content and swaps in with
   minimal layout shift. No client JS. */

export function ListSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="hh-wrap" style={{ padding: "24px 20px 48px" }} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton" style={{ height: 40, width: "min(420px, 70%)", marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 18, width: "min(560px, 90%)", marginBottom: 24 }} />
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
        }}
        aria-hidden="true"
      >
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="card" style={{ overflow: "hidden" }}>
            <div className="skeleton" style={{ height: 150, borderRadius: 0 }} />
            <div style={{ padding: 14 }}>
              <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 13, width: "50%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="hh-wrap" style={{ padding: "20px 20px 48px" }} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton" style={{ height: 260, marginBottom: 18 }} aria-hidden="true" />
      <div className="skeleton" style={{ height: 34, width: "min(480px, 80%)", marginBottom: 10 }} aria-hidden="true" />
      <div className="skeleton" style={{ height: 16, width: "min(360px, 60%)", marginBottom: 8 }} aria-hidden="true" />
      <div className="skeleton" style={{ height: 16, width: "min(300px, 50%)" }} aria-hidden="true" />
    </div>
  );
}
