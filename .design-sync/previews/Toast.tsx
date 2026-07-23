import { Toast } from "humblehalalsg";
import type { ReactNode } from "react";

/* The real Toast is `position: fixed` to the viewport bottom. Inside the capture
   frame (a transformed ancestor) that pins it to the frame edge and clips it, so
   this scoped override renders the same pill in normal flow for the preview. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <style>{`.toast{position:static !important;left:auto !important;bottom:auto !important;transform:none !important;animation:none !important;display:inline-flex !important;}`}</style>
      {children}
    </div>
  );
}

export const Saved = () => (
  <Frame>
    <Toast msg="Saved to your favourites" />
  </Frame>
);

export const Submitted = () => (
  <Frame>
    <Toast msg="Listing submitted for MUIS review" />
  </Frame>
);

export const LinkCopied = () => (
  <Frame>
    <Toast msg="Link to Qahwa & Co. copied" />
  </Frame>
);
