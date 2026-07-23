import { WatchFor } from "humblehalalsg";

export const Default = () => (
  <div style={{ maxWidth: 620 }}>
    <WatchFor
      items={[
        "Ask whether the outlet holds a current MUIS halal certificate, or only self-declares “no pork no lard”.",
        "Check that the certificate on display is still valid — look for the expiry date and certificate number.",
        "Confirm shared fryers and grills aren't used for non-halal items at the same counter.",
        "For chain outlets, verify this specific branch is certified — certification is per-premises, not per-brand.",
        "Watch for alcohol in sauces, marinades and desserts, even when the meat is halal.",
      ]}
    />
  </div>
);

export const Short = () => (
  <div style={{ maxWidth: 620 }}>
    <WatchFor
      items={[
        "Look up the outlet on the official MUIS HalalSG register before you order.",
        "Ask staff whether the halal certificate covers the whole menu or only selected items.",
      ]}
    />
  </div>
);
