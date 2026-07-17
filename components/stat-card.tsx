import { Icon } from "@/components/ui";
import { formatDelta } from "@/lib/deltas";

/* Dashboard KPI card. The delta badge renders only when a real prior-period
   comparison exists (delta === null/undefined → no badge — never a fake 0%). */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs previous period",
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  delta?: number | null;
  deltaLabel?: string;
  hint?: string;
  icon?: string;
}) {
  const up = typeof delta === "number" && delta >= 0;
  return (
    <div className="statx">
      {icon && (
        <span className="statx-icon" aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
      )}
      <div className="statx-body">
        <div className="statx-value">{value}</div>
        <div className="statx-label">{label}</div>
        {typeof delta === "number" ? (
          <div className={`statx-delta ${up ? "up" : "down"}`}>
            <Icon name={up ? "trend" : "chevdown"} size={12} /> {formatDelta(delta)} {deltaLabel}
          </div>
        ) : hint ? (
          <div className="statx-hint">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
