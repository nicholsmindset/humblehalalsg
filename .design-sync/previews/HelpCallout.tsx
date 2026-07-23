import { HelpCallout, PreviewShell } from "humblehalalsg";

export const Collections = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <HelpCallout feature="collections" />
    </div>
  </PreviewShell>
);

export const Payouts = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <HelpCallout feature="payouts" />
    </div>
  </PreviewShell>
);

export const MyRequests = () => (
  <PreviewShell>
    <div style={{ maxWidth: 560 }}>
      <HelpCallout feature="requests" />
    </div>
  </PreviewShell>
);
