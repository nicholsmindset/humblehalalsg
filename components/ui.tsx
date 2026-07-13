"use client";

/* Humble Halal — shared UI components (ported from components.jsx) */
import Image from "next/image";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { track } from "@/lib/analytics";
import { badgeMeta, HHData } from "@/lib/data";
import { isUnoptimizedImageSrc } from "@/lib/img";
import type { BadgeKey, Listing } from "@/lib/types";
import { scoreListing, scoreTone, muisUnbacked } from "@/lib/halal-score";
import { joinParts } from "@/lib/format";
import { useApp } from "./app-context";
import { ScreenLink } from "./screen-link";
import { useDirectory } from "./directory-context";

/* ---------------------------------------------------------------
   ICONS  (stroke-based, 24x24)
--------------------------------------------------------------- */
const ICONS: Record<string, string> = {
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.3-4.3",
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  briefcase: "M3 8h18v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm5 0V6a2 2 0 012-2h4a2 2 0 012 2v2",
  moon: "M16.5 16.5A7 7 0 119.5 4 5.6 5.6 0 0016.5 16.5z",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  heart: "M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.5 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.5-6 8-6s8 2 8 6",
  pin: "M12 22s7-6.4 7-12a7 7 0 10-14 0c0 5.6 7 12 7 12zm0-9a3 3 0 100-6 3 3 0 000 6z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20l1-6.1L3.2 9.5l6.1-.9z",
  starf: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 20l1-6.1L3.2 9.5l6.1-.9z",
  check: "M5 12l5 5 9-11",
  "shield-check": "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4",
  "badge-check": "M12 2.5l2.1 1.6 2.6-.2 1 2.4 2.2 1.4-.6 2.6.6 2.6-2.2 1.4-1 2.4-2.6-.2L12 21.5l-2.1-1.6-2.6.2-1-2.4-2.2-1.4.6-2.6L4.7 11l2.2-1.4 1-2.4 2.6.2zM9 12l2 2 4-4",
  crescent: "M16.5 16.5A7 7 0 119.5 4 5.6 5.6 0 0016.5 16.5z",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 7.5v.5",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  phone: "M5 4h3l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5V18a2 2 0 01-2 2A15 15 0 014 6a2 2 0 011-2z",
  whatsapp:
    "M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3zm0 2a7 7 0 11-3.7 12.9l-.3-.2-2.4.6.7-2.3-.2-.3A7 7 0 0112 5zm-2 3c-.3 0-.6.1-.8.4-.3.4-.8 1-.8 2 0 1.3.9 2.5 1 2.7.2.2 1.9 3 4.7 4 .7.3 1.2.4 1.6.3.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.1l-1.5-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.1-.2.1-.4 0-.2-.1-1-.4-1.8-1.1-.7-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4l-.6-1.5c-.1-.3-.3-.3-.4-.3z",
  directions: "M12 2l10 10-10 10L2 12 12 2zm0 5v3h4v3h-4v3l-4-4 4-4z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
  instagram: "M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5-1.5v.01",
  filter: "M3 5h18M6 12h12M10 19h4",
  sort: "M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l-3 3M17 20l3-3",
  chevron: "M9 6l6 6-6 6",
  chevdown: "M6 9l6 6 6-6",
  lock: "M7 11V7a5 5 0 0110 0v4M5 11h14v10H5V11zm7 4v3",
  back: "M15 6l-6 6 6 6",
  x: "M6 6l12 12M18 6L6 18",
  arrow: "M5 12h14M13 6l6 6-6 6",
  near: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3",
  utensils: "M5 3v8a2 2 0 002 2v8M5 3v4M8 3v4M16 3c-1.5 0-2 2-2 5s.5 4 2 4v8",
  coffee: "M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5V8zM17 9h2a2 2 0 010 4h-2M7 4V3M10 4V3M13 4V3",
  store: "M4 9l1-5h14l1 5M4 9v10h16V9M4 9h16M9 19v-5h6v5",
  basket: "M5 9h14l-1.5 10.5A2 2 0 0115.5 21h-7A2 2 0 016.5 19.5L5 9zM9 9l3-5 3 5M9 13v3M15 13v3",
  sparkles: "M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3zM19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  wrench: "M14.5 6.5a3.5 3.5 0 01-4.6 4.6L5 16l3 3 4.9-4.9a3.5 3.5 0 004.6-4.6l-2 2-2-2 2-2z",
  mosque: "M12 2c2 2.5 5 3.5 5 7H7c0-3.5 3-4.5 5-7zM5 11h14v9H5v-9zM5 11v-1a2 2 0 012-2M19 11v-1a2 2 0 00-2-2M10 20v-3a2 2 0 014 0v3",
  family: "M8 8a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM5 20v-5a3 3 0 013-3M19 20v-5a3 3 0 00-3-3M11 20v-3a1 1 0 012 0v3",
  bookmark: "M6 3h12v18l-6-4-6 4V3z",
  bell: "M6 10a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 004 0",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 00-1.7-1l-.3-2.5h-4l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.5L4.1 11a7 7 0 000 2l-2 1.5 2 3.5 2.4-1a7 7 0 001.7 1l.3 2.5h4l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.5-2-1.5a7 7 0 00.1-1z",
  chart: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zm10 3a3 3 0 100-6 3 3 0 000 6z",
  upload: "M12 16V4M8 8l4-4 4 4M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3",
  camera: "M3 8h3l2-2h8l2 2h3v12H3V8zm9 3a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  flag: "M5 21V4M5 4h12l-2 4 2 4H5",
  edit: "M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4",
  doc: "M7 3h7l5 5v13H7V3zm7 0v5h5",
  building: "M5 21V4a1 1 0 011-1h8a1 1 0 011 1v17M15 9h3a1 1 0 011 1v11M8 7h3M8 11h3M8 15h3",
  bed: "M2 10v9M2 18h20M22 13v6M2 13h13a5 5 0 015 5M6 13v-2a1 1 0 011-1h3a1 1 0 011 1v2",
  tag: "M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9zm5-5v.01",
  list: "M8 6h13M8 12h13M8 18h13M3 6v.01M3 12v.01M3 18v.01",
  menu: "M3 6h18M3 12h18M3 18h18",
  map: "M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14",
  logout: "M14 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h7a2 2 0 002-2v-2M9 12h12m0 0l-3-3m3 3l-3 3",
  google: "GOOGLE",
  mail: "M3 6h18v12H3V6zm0 0l9 7 9-7",
  dollar: "M12 2v20M17 6.5C17 4.6 14.8 4 12 4S7 4.9 7 7s2.5 2.8 5 3.2 5 1.2 5 3.3-2.2 3-5 3-5-.8-5-2.7",
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z",
  trophy: "M7 4h10v4a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 18h6M10 14h4l-1 4h-2l-1-4z",
  trend: "M3 17l6-6 4 4 7-7M21 8v4M21 8h-4",
  warning: "M12 3l9 16H3L12 3zm0 6v5m0 3v.01",
  refresh: "M21 12a9 9 0 11-3-6.7M21 4v4h-4",
  calendar: "M4 6h16v15H4V6zm0 5h16M8 3v4M16 3v4",
  ticket: "M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 00-2 2H6a2 2 0 01-2-2 2 2 0 000-4zm10-2v2m0 4v2m0 4v2",
  share: "M6 12a3 3 0 100-2 3 3 0 000 2zm12-5a3 3 0 100-2 3 3 0 000 2zm0 12a3 3 0 100-2 3 3 0 000 2zM8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2",
  users: "M9 11a3 3 0 100-6 3 3 0 000 6zm-7 9c0-3 3-5 7-5s7 2 7 5M17 11a3 3 0 000-6M22 20c0-2.5-2-4.2-5-4.7",
  external: "M14 5h5v5M19 5l-8 8M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5",
  megaphone: "M3 11v2a1 1 0 001 1h2l9 5V6l-9 5H4a1 1 0 00-1 1zM18 9a3 3 0 010 6",
};

export interface IconProps {
  name: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size, style, className, strokeWidth = 1.9 }: IconProps) {
  if (name === "google") {
    return (
      <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" style={style} className={className} aria-hidden="true" focusable="false">
        <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.6a4.8 4.8 0 01-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.6z" />
        <path fill="#34A853" d="M12 23c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10.4 10.4 0 0012 23z" />
        <path fill="#FBBC05" d="M6.2 14.6a6.2 6.2 0 010-4l-.1-2.7H2.7a10.4 10.4 0 000 9.4l3.5-2.7z" />
        <path fill="#EA4335" d="M12 5.4c1.5 0 2.9.5 4 1.5l3-3A10.3 10.3 0 002.7 7.9l3.5 2.7C7 7.2 9.3 5.4 12 5.4z" />
      </svg>
    );
  }
  const d = ICONS[name] || ICONS.info;
  const filled = name === "starf";
  return (
    <svg
      width={size || 20}
      height={size || 20}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

/* ---------------------------------------------------------------
   LOGO
--------------------------------------------------------------- */
export function Logo({ onClick, light }: { onClick?: () => void; light?: boolean }) {
  return (
    <div className="hh-logo" onClick={onClick}>
      <div className="mark">
        <Icon name="crescent" size={19} />
      </div>
      <div className="name" style={light ? { color: "#fff" } : undefined}>
        Humble Halal
        <small>Singapore</small>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   TRUST BADGE
--------------------------------------------------------------- */
export function Badge({ type, lg }: { type: BadgeKey; lg?: boolean }) {
  const m = badgeMeta[type];
  if (!m) return null;
  return (
    <span className={`badge ${m.cls} ${lg ? "badge--lg" : ""}`} title={m.label}>
      <Icon name={m.icon} size={lg ? 15 : 13} strokeWidth={2.1} />
      {m.label}
    </span>
  );
}

/* ---------------------------------------------------------------
   RATING
--------------------------------------------------------------- */
export function Rating({
  value,
  count,
  showCount = true,
}: {
  value: number;
  count?: number;
  showCount?: boolean;
}) {
  // No reviews yet → show an honest "New" state, never a fabricated star score
  // (audit #4/#9). Only when count is explicitly 0; undefined means "unknown".
  if (count === 0) {
    return (
      <span className="rating rating-new">
        <Icon name="sparkles" size={13} /> New
      </span>
    );
  }
  return (
    <span className="rating">
      <Icon name="starf" size={15} />
      {value.toFixed(1)}
      {showCount && count != null && <span className="count">({count})</span>}
    </span>
  );
}

/* ---------------------------------------------------------------
   IMAGE PLACEHOLDER
--------------------------------------------------------------- */
export function ImagePh({
  label,
  tone,
  ratio,
  icon = "camera",
  style,
  className,
  src,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority,
}: {
  label?: string;
  tone?: string;
  ratio?: string;
  icon?: string;
  style?: CSSProperties;
  className?: string;
  src?: string;
  sizes?: string;
  priority?: boolean;
}) {
  // `loaded` controls the fade-in; `failed` falls back to the striped placeholder.
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  return (
    <div
      className={`imgph ${className || ""}`}
      data-tone={tone || "cream"}
      style={{ aspectRatio: ratio || undefined, ...style }}
    >
      {(!showImg || !loaded) && (
        <span className="imgph-ico" aria-hidden="true">
          <Icon name={icon} />
        </span>
      )}
      {showImg && (
        <Image
          className="imgph-img"
          src={src}
          alt={label || ""}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isUnoptimizedImageSrc(src)}
          style={{ objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .35s ease" }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   LISTING CARD
--------------------------------------------------------------- */
export function ListingCard({
  item,
  variant = "standard",
  onOpen,
}: {
  item: Listing;
  variant?: "standard" | "featured" | "row";
  /** Optional analytics hook — fired alongside trackRecent when the card's main link is opened. */
  onOpen?: () => void;
}) {
  const { navigate, trackRecent, toggleSave, state } = useApp();
  const saved = state.saved.includes(item.id);
  // Full-card overlay link → prefetches the detail route on hover/touch (intent),
  // so the tap feels instant without eagerly pulling every card's payload.
  const cardLink = (
    <ScreenLink
      screen="detail"
      params={{ id: item.id }}
      className="card-stretch"
      intent
      onClick={() => { trackRecent(item.id); onOpen?.(); }}
      aria-label={joinParts([item.name, joinParts([item.cuisine, item.area], ", ")], " — ")}
    />
  );

  // Subtle "Claim" chip on unclaimed listings (sits above the full-card link via
  // z-index + stopPropagation, so it claims rather than opening the detail page).
  // Halal-verification pill — shows the tier LABEL (not a 0–100 number): a bare
  // number next to "halal" reads like a grade ("42 = barely halal"), which
  // undersells genuinely-halal-but-uncertified places. Shown only for earned
  // tiers (muis / muis-listed / admin / community) and flagged listings; nothing
  // for declared/pending, where the tier badge beside it ("Muslim-Owned" /
  // "Halal-friendly") already carries the signal. Detail page keeps the reasons.
  const hsPill = (() => {
    const hs = scoreListing(item);
    if (hs.tier === "declared" || hs.tier === "pending") return null;
    return (
      <span className="hs-pill" title={hs.blurb}>
        <span className="hs-dot" style={{ background: scoreTone(hs.tier) }} />
        {hs.label}
      </span>
    );
  })();
  const claimChip = !item.claimed ? (
    <button
      className="claim-chip"
      title="Own this business? Claim your free listing"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); track.leadAction("claim", item.slug || item.id, item.catId); navigate("claim", { id: item.slug || item.id }); }}
      style={{ position: "relative", zIndex: 2, fontSize: ".72rem", fontWeight: 700, color: "var(--ink-soft)", background: "var(--cream-200)", border: "1px solid var(--line)", borderRadius: 999, padding: "2px 8px", display: "inline-flex", alignItems: "center", gap: 3, cursor: "pointer" }}
    >
      <Icon name="building" size={11} /> Claim
    </button>
  ) : null;

  if (variant === "row") {
    return (
      <div className="card card-hover" style={{ display: "flex", borderRadius: "var(--r-md)" }}>
        {cardLink}
        <ImagePh label={item.img} tone={item.tone} src={item.image} style={{ width: 108, flex: "none" }} />
        <div className="lc-body" style={{ flex: 1, padding: "12px 14px" }}>
          <div className="flex between center">
            <span className="lc-name" style={{ fontSize: "1rem" }}>
              {item.name}
            </span>
            <Rating value={item.rating} count={item.reviews} showCount={false} />
          </div>
          <div className="lc-meta">
            {joinParts([item.cuisine, item.area])}
          </div>
          <div className="lc-badges" style={{ marginTop: 2 }}>
            {hsPill}
            {item.badges.filter((b) => b !== "muis" || !muisUnbacked(item)).slice(0, 2).map((b) => (
              <Badge key={b} type={b} />
            ))}
            {claimChip}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card card-hover listing ${variant === "featured" ? "listing-feat" : ""}`}>
      {cardLink}
      <div className="lc-media" style={{ position: "relative" }}>
        <ImagePh label={item.img} tone={item.tone} src={item.image} style={{ width: "100%", height: "100%" }} icon="utensils" />
        <button
          className="save-fab"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(item.id);
          }}
          style={{
            position: "absolute", top: 10, right: 10, width: 44, height: 44, borderRadius: "50%",
            border: "none", background: "rgba(255,255,255,.92)", display: "grid", placeItems: "center",
            boxShadow: "var(--sh-sm)", color: saved ? "var(--danger)" : "var(--ink-soft)",
          }}
        >
          <Icon name="heart" size={18} style={{ fill: saved ? "var(--danger)" : "none" }} />
        </button>
        {item.featured && (
          <span style={{ position: "absolute", top: 12, left: 12 }} className="tag">
            <Icon name="trophy" size={13} />
            <span style={{ marginLeft: 2 }}>Featured</span>
          </span>
        )}
      </div>
      <div className="lc-body">
        <div className="lc-top">
          <div>
            <div className="lc-name">{item.name}</div>
            <div className="lc-meta">{item.cuisine}</div>
          </div>
          <Rating value={item.rating} count={item.reviews} showCount={false} />
        </div>
        <div className="lc-badges">
          {hsPill}
          {item.badges.filter((b) => b !== "muis" || !muisUnbacked(item)).slice(0, 3).map((b) => (
            <Badge key={b} type={b} />
          ))}
          {item.franchise && (
            <span className="outlet-chip">
              <Icon name="pin" size={12} /> {item.outletCount} outlets
            </span>
          )}
          {claimChip}
        </div>
        <p className="lc-blurb">{item.blurb}</p>
        <div className="lc-foot">
          <span className="lc-meta" style={{ gap: 4 }}>
            <Icon name="pin" size={14} />{" "}
            {item.franchise
              ? joinParts([`${item.outletCount} locations`, item.distance ? `nearest ${item.distance}` : ""])
              : joinParts([item.area, item.distance])}
          </span>
          <span className={item.open ? "status-open" : "status-closed"} style={{ fontSize: ".8rem" }}>
            <span className={`status-dot ${item.open ? "open" : "closed"}`}></span>
            {item.open ? "Open" : "Closed"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SEARCH BAR
--------------------------------------------------------------- */
interface Suggestion {
  key: string;
  label: string;
  sub: string;
  icon: string;
  go: () => void;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  autoFocus,
  suggest,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  suggest?: boolean;
}) {
  const { navigate } = useApp();
  const dir = useDirectory();
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!suggest || value.trim().length < 1) return [];
    const s = value.toLowerCase();
    const out: Suggestion[] = [];
    HHData.categories
      .filter((c) => c.label.toLowerCase().includes(s))
      .slice(0, 2)
      .forEach((c) =>
        out.push({ key: `c-${c.id}`, label: c.label, sub: "Category", icon: c.icon, go: () => navigate("explore", { cat: c.id }) }),
      );
    HHData.areas
      .filter((a) => a.name.toLowerCase().includes(s))
      .slice(0, 2)
      .forEach((a) =>
        out.push({ key: `a-${a.id}`, label: `Halal in ${a.name}`, sub: "Area", icon: "pin", go: () => navigate("seo", { slug: `halal-food-in-${a.id}` }) }),
      );
    dir.listings
      .filter((l) => (l.name + l.cuisine).toLowerCase().includes(s))
      .slice(0, 5)
      .forEach((l) =>
        out.push({ key: `l-${l.id}`, label: l.name, sub: `${l.cuisine} · ${l.area}`, icon: "store", go: () => navigate("detail", { id: l.id }) }),
      );
    return out.slice(0, 7);
  }, [suggest, value, navigate, dir]);

  const showList = suggest && open && suggestions.length > 0;

  useEffect(() => {
    if (!suggest) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [suggest]);

  const pick = (i: number) => {
    const item = suggestions[i];
    if (item) {
      item.go();
      setOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && hi >= 0) {
      e.preventDefault();
      pick(hi);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="searchbar-wrap" ref={wrapRef} style={{ position: "relative" }}>
      <form
        className="searchbar"
        role={suggest ? "search" : undefined}
        onSubmit={(e) => {
          e.preventDefault();
          if (showList && hi >= 0) {
            pick(hi);
            return;
          }
          onSubmit && onSubmit(value);
        }}
      >
        <Icon name="search" className="lead" />
        {/* ARIA combobox semantics live on the interactive input, not the <form>
            (role="combobox" on a form is invalid — axe aria-allowed-role). */}
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          autoFocus={autoFocus}
          aria-label="Search"
          role={suggest ? "combobox" : undefined}
          aria-expanded={suggest ? showList : undefined}
          aria-haspopup={suggest ? "listbox" : undefined}
          aria-autocomplete={suggest ? "list" : undefined}
          aria-controls={suggest && showList ? "search-listbox" : undefined}
          aria-activedescendant={showList && hi >= 0 ? `search-opt-${hi}` : undefined}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHi(-1);
          }}
          onFocus={() => suggest && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder || "Search restaurants, cafés, services, shops…"}
        />
        <button type="submit" className="btn btn-primary btn-sm sb-btn">
          Search
        </button>
      </form>
      {showList && (
        <ul className="search-suggest" id="search-listbox" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.key}
              id={`search-opt-${i}`}
              role="option"
              aria-selected={i === hi}
              className={`search-opt ${i === hi ? "hi" : ""}`}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(i);
              }}
            >
              <Icon name={s.icon} size={16} />
              <span className="so-label">{s.label}</span>
              <span className="so-sub">{s.sub}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   CATEGORY PILL / BUTTON
--------------------------------------------------------------- */
export function CategoryButton({
  cat,
  onClick,
}: {
  cat: { icon: string; label: string };
  onClick?: () => void;
}) {
  return (
    <button className="cat-btn" onClick={onClick}>
      <span className="cat-ico">
        <Icon name={cat.icon} size={22} />
      </span>
      <span>{cat.label}</span>
    </button>
  );
}

/* ---------------------------------------------------------------
   SECTION HEADER
--------------------------------------------------------------- */
export function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action && (
        <span className="link" onClick={onAction}>
          {action}
          <Icon name="chevron" size={15} />
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   TOAST
--------------------------------------------------------------- */
export function Toast({ msg }: { msg: string }) {
  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {msg && (
        <div className="toast">
          <Icon name="check" size={16} style={{ color: "var(--gold)" }} />
          {msg}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   EMPTY STATE
--------------------------------------------------------------- */
export function Empty({
  icon = "search",
  title,
  body,
  action,
  onAction,
}: {
  icon?: string;
  title?: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-ico">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p className="muted">{body}</p>
      {action && (
        <button className="btn btn-primary mt8" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

/* Humble Halal Rewards — shows estimated cashback on a travel purchase using the
   live LiteAPI loyalty rate. Renders nothing unless loyalty is enabled. */
export function RewardsNote({ amount, currency }: { amount: number | null; currency: string }) {
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    let on = true;
    fetch("/api/travel/loyalty").then((r) => r.json()).then((d) => { if (on && d.ok && d.enabled) setRate(Number(d.cashbackRate) || 0); }).catch(() => {});
    return () => { on = false; };
  }, []);
  if (!rate || !amount) return null;
  const back = Math.max(1, Math.round(amount * rate));
  return (
    <div className="rewards-note">
      <Icon name="starf" size={15} />
      <div className="rewards-body">
        <span>Earn approx. {currency} {back} cashback with <strong>Humble Halal Rewards</strong> on this booking.</span>
        <details className="rewards-how">
          <summary>How Humble Halal Rewards works</summary>
          <ul>
            <li>Earn cashback on eligible hotel &amp; flight bookings — the amount above is what this booking earns.</li>
            <li>It&apos;s credited to your Rewards balance once your trip is completed.</li>
            <li>Apply your balance towards future Humble Halal travel bookings.</li>
            <li>The figure is indicative until your booking is confirmed, and is subject to Rewards terms.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

/* Promo / voucher code field. Validates against the LiteAPI voucher system; when
   vouchers aren't enabled it shows a friendly note and emits nothing. onApply gives
   the validated code + computed discount back to the checkout. */
export function PromoCode({ amount, currency, onApply }: { amount: number | null; currency: string; onApply?: (code: string, discount: number) => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    if (!code.trim()) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch(`/api/travel/voucher?code=${encodeURIComponent(code.trim())}`);
      const d = await r.json();
      if (d.valid) {
        if (d.discountType === "percentage") {
          if (!amount) { setMsg(`Applied — ${d.discountValue}% off (shown at payment).`); onApply?.(d.code, 0); }
          else { const disc = Math.round((amount * Number(d.discountValue)) / 100); setMsg(`Applied — ${d.discountValue}% off (${currency} ${disc}).`); onApply?.(d.code, disc); }
        } else {
          const disc = Math.round(Number(d.discountValue) || 0);
          setMsg(`Applied — ${currency} ${disc} off.`);
          onApply?.(d.code, disc);
        }
      } else setMsg(d.message || "That code isn't valid.");
    } catch { setMsg("Couldn't check that code."); }
    setBusy(false);
  };
  if (!open) return <button type="button" className="promo-toggle" onClick={() => setOpen(true)}>Have a promo code?</button>;
  return (
    <div className="promo-box">
      <div className="promo-row">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Promo code" />
        <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={apply}>{busy ? "…" : "Apply"}</button>
      </div>
      {msg && <p className="promo-msg">{msg}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------
   DIALOG A11Y HOOK — focus trap, Esc-to-close, focus restore
--------------------------------------------------------------- */
export function useDialog(ref: React.RefObject<HTMLElement | null>, onClose?: () => void) {
  useEffect(() => {
    const node = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    const sel =
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>(sel) || []).filter(
        (el) => el.offsetParent !== null,
      );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [ref, onClose]);
}

/* ---------------------------------------------------------------
   BODY SCROLL LOCK — freeze the page behind full-screen overlays
   (modals, drawers, sheets). Ref-counted so stacked overlays only
   unlock when the last one closes. Deliberately NOT part of
   useDialog: small anchored popovers (notification bell, sort menu)
   trap focus without freezing the page.
--------------------------------------------------------------- */
let scrollLockCount = 0;
export function useBodyScrollLock(active: boolean = true) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    if (scrollLockCount === 0) {
      // Reserve the scrollbar gutter so desktop layout doesn't shift.
      const gutter = window.innerWidth - root.clientWidth;
      root.style.setProperty("--scroll-lock-gutter", `${gutter}px`);
      root.classList.add("scroll-locked");
    }
    scrollLockCount += 1;
    return () => {
      scrollLockCount -= 1;
      if (scrollLockCount === 0) {
        root.classList.remove("scroll-locked");
        root.style.removeProperty("--scroll-lock-gutter");
      }
    };
  }, [active]);
}

/* ---------------------------------------------------------------
   MODAL
--------------------------------------------------------------- */
export function Modal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose?: () => void;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, onClose);
  useBodyScrollLock();
  return (
    <div className="modal-veil" onClick={onClose}>
      <div
        className="modal"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex between center" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "1.3rem" }}>{title}</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Close dialog"
              style={{ padding: 8 }}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PAGE HEADER (mobile back bar)
--------------------------------------------------------------- */
export function MobileHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="mob-head">
      <button className="btn btn-ghost" style={{ padding: 8 }} onClick={onBack} aria-label="Go back">
        <Icon name="back" size={22} />
      </button>
      <span className="mh-title">{title}</span>
      <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}

/* ---------------------------------------------------------------
   WIZARD CHROME (shared by add-listing, host-event, campaign builder)
--------------------------------------------------------------- */
export function WizardSteps({ steps, step }: { steps: readonly string[]; step: number }) {
  return (
    <div className="steps wizard-steps">
      {steps.map((s, i) => (
        <Fragment key={s}>
          <div className={`step ${i < step ? "done" : ""} ${i === step ? "active" : ""}`}>
            <span className="num">{i < step ? <Icon name="check" size={15} /> : i + 1}</span>
            <span className="lbl hide-mob">{s}</span>
          </div>
          {i < steps.length - 1 && <span className={`bar ${i < step ? "done" : ""}`} />}
        </Fragment>
      ))}
    </div>
  );
}

/** Wizard action row: in-flow on desktop, sticky above the tab bar on mobile so
    Continue is never below the fold on long steps. Give the scrolling parent
    the `has-wizard-footer` class so content clears the fixed bar. */
export function WizardFooter({ children }: { children: ReactNode }) {
  return <div className="wizard-footer">{children}</div>;
}
