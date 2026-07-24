import { Logo } from "humblehalalsg";

export const Default = () => (
  <div style={{ padding: 12 }}>
    <Logo />
  </div>
);

export const OnDark = () => (
  <div
    style={{
      background: "linear-gradient(135deg, var(--emerald-700), var(--emerald))",
      padding: "28px 24px",
      borderRadius: 16,
      display: "inline-block",
    }}
  >
    <Logo light />
  </div>
);

export const InTopBar = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      background: "var(--white)",
      border: "1px solid var(--line)",
      borderRadius: 14,
      padding: "12px 18px",
      maxWidth: 480,
      boxShadow: "var(--sh-sm)",
    }}
  >
    <Logo onClick={() => {}} />
    <span style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--emerald)" }}>Add your business</span>
  </div>
);
