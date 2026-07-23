import { Badge } from "humblehalalsg";

export const MuisCertified = () => <Badge type="muis" />;

export const AdminVerified = () => <Badge type="admin" />;

export const MuslimOwned = () => <Badge type="owned" />;

export const Large = () => <Badge type="muis" lg />;

export const AllStatuses = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {(["muis", "admin", "owned", "friendly", "nopork", "pending", "family", "prayer"] as const).map(
      (t) => (
        <Badge key={t} type={t} />
      ),
    )}
  </div>
);
