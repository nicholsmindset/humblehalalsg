import { Icon } from "humblehalalsg";

const tile = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 8,
  padding: "16px 8px",
  background: "var(--white)",
  border: "1px solid var(--line)",
  borderRadius: 14,
};
const chip = {
  width: 46,
  height: 46,
  borderRadius: 13,
  background: "var(--emerald-50)",
  color: "var(--emerald)",
  display: "grid",
  placeItems: "center",
};
const cap = { fontSize: ".72rem", fontWeight: 600, color: "var(--ink-soft)" };

const NAMES = ["search", "heart", "starf", "shield-check", "mosque", "utensils", "coffee", "pin", "crescent"];

export const IconSet = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, maxWidth: 360 }}>
    {NAMES.map((n) => (
      <div key={n} style={tile}>
        <span style={chip}>
          <Icon name={n} size={28} />
        </span>
        <span style={cap}>{n}</span>
      </div>
    ))}
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 22, color: "var(--emerald)", padding: 8 }}>
    {[18, 28, 40, 56].map((s) => (
      <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Icon name="mosque" size={s} />
        <span style={cap}>{s}px</span>
      </div>
    ))}
  </div>
);

export const StrokeWeights = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 26, color: "var(--emerald)", padding: 8 }}>
    {[1.2, 1.9, 2.8].map((w) => (
      <div key={w} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <Icon name="shield-check" size={40} strokeWidth={w} />
        <span style={cap}>{w.toFixed(1)}</span>
      </div>
    ))}
  </div>
);

export const AccentColours = () => (
  <div style={{ display: "flex", gap: 18, padding: 8 }}>
    <span style={{ color: "var(--emerald)" }}>
      <Icon name="crescent" size={40} />
    </span>
    <span style={{ color: "var(--gold)" }}>
      <Icon name="starf" size={40} />
    </span>
    <span style={{ color: "var(--ink)" }}>
      <Icon name="utensils" size={40} />
    </span>
    <span style={{ color: "var(--danger)" }}>
      <Icon name="heart" size={40} />
    </span>
  </div>
);
