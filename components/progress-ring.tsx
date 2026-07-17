"use client";

/* One SVG ring/donut primitive for every circular metric on the site:
   tools prayer countdown (ring), owner profile strength (ring), event
   capacity (donut), stall halal-confidence (ring). Pure SVG, no deps. */

import type { CSSProperties, ReactNode } from "react";

const TONE_COLOR: Record<string, string> = {
  emerald: "var(--emerald)",
  gold: "var(--gold)",
  danger: "var(--danger)",
};

export function ProgressRing({
  value,
  size = 96,
  stroke,
  tone = "emerald",
  children,
  label,
  className,
  style,
}: {
  /** 0..1 — clamped; NaN renders an empty track (honest unknown state). */
  value: number;
  size?: number;
  /** Stroke width; default scales for ring vs donut feel (pass ~size/6 for donut). */
  stroke?: number;
  tone?: "emerald" | "gold" | "danger";
  /** Center content (e.g. "82%", a countdown, a score). */
  children?: ReactNode;
  /** Accessible label; the ring is exposed as a meter when provided. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const w = stroke ?? Math.max(6, Math.round(size / 12));
  const r = (size - w) / 2;
  const c = 2 * Math.PI * r;
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  return (
    <div
      className={`pring ${className || ""}`}
      style={{ width: size, height: size, position: "relative", flex: "none", ...style }}
      role={label ? "meter" : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? Math.round(v * 100) : undefined}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={w} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_COLOR[tone] || TONE_COLOR.emerald}
          strokeWidth={w}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .4s ease" }}
        />
      </svg>
      {children && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
