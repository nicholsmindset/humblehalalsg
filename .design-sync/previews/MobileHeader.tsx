import { MobileHeader, Icon } from "humblehalalsg";
import type { ReactNode } from "react";

/* The capture viewport is desktop-width (>=861px) where `.mob-head` is hidden by
   its mobile-only media query; this scoped override keeps the real component
   visible in the preview card. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: 420, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <style>{`.mob-head{display:flex !important;position:static !important;}`}</style>
      {children}
    </div>
  );
}

export const WithBack = () => (
  <Frame>
    <MobileHeader title="Warung Bumbu Rempah" onBack={() => {}} />
  </Frame>
);

export const WithAction = () => (
  <Frame>
    <MobileHeader
      title="Saved places"
      onBack={() => {}}
      right={
        <button
          aria-label="Share"
          style={{
            border: "none",
            background: "transparent",
            padding: 8,
            color: "var(--emerald)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="share" size={20} />
        </button>
      }
    />
  </Frame>
);

export const TitleOnly = () => (
  <Frame>
    <MobileHeader title="Halal food in Bugis" onBack={() => {}} />
  </Frame>
);
