"use client";

/* Humble Halal — OTA interaction primitives (zzzello-grade, emerald brand).
   Composed by the hotels & flights screens. Styles live in styles/ota.css.
   Pure/no-context primitives so both verticals can reuse them. */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./ui";

/* ---------------------------------------------------------------
   Date helpers (local-time safe; ISO = YYYY-MM-DD)
--------------------------------------------------------------- */
export function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function fmtRange(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ---------------------------------------------------------------
   useClickOutside
--------------------------------------------------------------- */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  cb: () => void,
  active = true,
) {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    if (!active) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cbRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cbRef.current();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, active]);
}

/* ---------------------------------------------------------------
   Popover — controlled; wraps a trigger + floating panel
--------------------------------------------------------------- */
export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = "left",
  panelClassName,
  panelLabel,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
  panelLabel?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  useClickOutside(wrap, onClose, open);
  return (
    <div className="ota-pop-wrap" ref={wrap}>
      {trigger}
      {open && (
        <div
          className={`ota-popover ${align === "right" ? "right" : ""} ${panelClassName || ""}`}
          role="dialog"
          aria-label={panelLabel || "Options"}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Carousel — arrow-controlled horizontal scroller
--------------------------------------------------------------- */
export function Carousel({
  title,
  action,
  onAction,
  children,
  ariaLabel,
}: {
  title?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);
  const scrollBy = (dir: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" });
  };
  const arrows = (
    <div className="ota-carousel-arrows">
      <button className="ota-arrow" aria-label="Previous" disabled={!canPrev} onClick={() => scrollBy(-1)}>
        <Icon name="back" size={18} />
      </button>
      <button className="ota-arrow" aria-label="Next" disabled={!canNext} onClick={() => scrollBy(1)}>
        <Icon name="chevron" size={18} />
      </button>
    </div>
  );
  return (
    <section className="ota-carousel" aria-label={ariaLabel || title}>
      {(title || action) && (
        <div className="ota-carousel-head">
          {title && <h2>{title}</h2>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
            {action && (
              <button className="link" onClick={onAction} style={{ background: "none", border: 0 }}>
                {action}
              </button>
            )}
            {arrows}
          </div>
        </div>
      )}
      <div className="ota-track" ref={track} role="list">
        {children}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   Stepper — single −/value/+ row
--------------------------------------------------------------- */
export function Stepper({
  label,
  sub,
  value,
  min = 0,
  max = 16,
  onChange,
}: {
  label: string;
  sub?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ota-step-row">
      <div className="ota-step-meta">
        <div className="ota-step-label">{label}</div>
        {sub && <div className="ota-step-sub">{sub}</div>}
      </div>
      <div className="ota-step-ctrl">
        <button
          className="ota-step-btn"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Icon name="minus" size={16} />
        </button>
        <span className="ota-step-val" aria-live="polite">{value}</span>
        <button
          className="ota-step-btn"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   OccupancyField — rooms / adults / children popover
--------------------------------------------------------------- */
export interface Occupancy {
  rooms: number;
  adults: number;
  children: number;
}
export function OccupancyField({
  value,
  onChange,
  withRooms = true,
  label = "Guests",
}: {
  value: Occupancy;
  onChange: (o: Occupancy) => void;
  withRooms?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const summary = `${value.adults} adult${value.adults === 1 ? "" : "s"}${
    value.children ? ` · ${value.children} child${value.children === 1 ? "" : "ren"}` : ""
  }${withRooms ? ` · ${value.rooms} room${value.rooms === 1 ? "" : "s"}` : ""}`;
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="right"
      panelLabel={label}
      trigger={
        <button type="button" className="ota-seg" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
          <span className="ota-seg-label">{label}</span>
          <span className="ota-seg-value">{summary}</span>
        </button>
      }
    >
      <div className="ota-stepper">
        <Stepper label="Adults" sub="Age 12+" value={value.adults} min={1} max={9} onChange={(v) => onChange({ ...value, adults: v })} />
        <Stepper label="Children" sub="Age 0–11" value={value.children} min={0} max={8} onChange={(v) => onChange({ ...value, children: v })} />
        {withRooms && (
          <Stepper label="Rooms" value={value.rooms} min={1} max={8} onChange={(v) => onChange({ ...value, rooms: v })} />
        )}
        <div className="ota-step-done">
          <button className="btn btn-soft btn-sm" onClick={() => setOpen(false)}>Done</button>
        </div>
      </div>
    </Popover>
  );
}

/* ---------------------------------------------------------------
   DateRangeField — two-month range calendar in a popover
--------------------------------------------------------------- */
function buildMonth(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay(); // 0 = Sunday
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DateRangeField({
  checkin,
  checkout,
  onChange,
  startLabel = "Dates",
  singleDate = false,
}: {
  checkin: string | null;
  checkout: string | null;
  onChange: (checkin: string | null, checkout: string | null) => void;
  startLabel?: string;
  /** One-way mode: pick a single date, no range, closes on select. */
  singleDate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => startOfToday(), []);
  const [view, setView] = useState(() => {
    const base = checkin ? parseISO(checkin) : today;
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const pick = (d: Date) => {
    const iso = isoOf(d);
    if (singleDate) {
      onChange(iso, null);
      setOpen(false);
    } else if (!checkin || (checkin && checkout)) {
      onChange(iso, null);
    } else if (iso <= checkin) {
      onChange(iso, null);
    } else {
      onChange(checkin, iso);
      setOpen(false);
    }
  };

  const months = [
    { y: view.y, m: view.m },
    { y: view.m === 11 ? view.y + 1 : view.y, m: (view.m + 1) % 12 },
  ];
  const canBack = view.y > today.getFullYear() || (view.y === today.getFullYear() && view.m > today.getMonth());
  const shift = (dir: number) => {
    setView((v) => {
      const nm = v.m + dir;
      if (nm < 0) return { y: v.y - 1, m: 11 };
      if (nm > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m: nm };
    });
  };

  const summary = singleDate
    ? checkin
      ? fmtRange(checkin)
      : null
    : checkin && checkout
      ? `${fmtRange(checkin)} – ${fmtRange(checkout)}`
      : checkin
        ? `${fmtRange(checkin)} – …`
        : null;

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      panelLabel="Select dates"
      panelClassName="ota-cal-pop"
      trigger={
        <button type="button" className="ota-seg" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
          <span className="ota-seg-label">{startLabel}</span>
          <span className={`ota-seg-value ${summary ? "" : "placeholder"}`}>{summary || "Add dates"}</span>
        </button>
      }
    >
      <div className="ota-cal-top">
        <button className="ota-cal-nav" aria-label="Previous month" disabled={!canBack} onClick={() => shift(-1)}>
          <Icon name="back" size={16} />
        </button>
        <button className="ota-cal-nav" aria-label="Next month" onClick={() => shift(1)}>
          <Icon name="chevron" size={16} />
        </button>
      </div>
      <div className="ota-cal-months">
        {months.map(({ y, m }) => (
          <div className="ota-cal-month" key={`${y}-${m}`}>
            <div className="ota-cal-title">
              {new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </div>
            <div className="ota-cal-dows">
              {DOW.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="ota-cal-grid">
              {buildMonth(y, m).map((d, i) => {
                if (!d) return <span key={i} />;
                const iso = isoOf(d);
                const disabled = d < today;
                const isStart = iso === checkin;
                const isEnd = iso === checkout;
                const inRange = !!checkin && !!checkout && iso > checkin && iso < checkout;
                return (
                  <button
                    key={i}
                    className={`ota-cal-cell ${isStart ? "start" : ""} ${isEnd ? "end" : ""} ${inRange ? "in-range" : ""}`}
                    disabled={disabled}
                    aria-label={d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    onClick={() => pick(d)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="ota-cal-hint">{singleDate ? "Select your departure date" : checkin && !checkout ? "Select a check-out date" : "Select your travel dates"}</p>
    </Popover>
  );
}

/* ---------------------------------------------------------------
   RatingBadge — emerald score chip + word + count
--------------------------------------------------------------- */
function scoreWord(score: number): string {
  if (score >= 9) return "Superb";
  if (score >= 8.5) return "Fabulous";
  if (score >= 8) return "Very good";
  if (score >= 7) return "Good";
  if (score >= 6) return "Pleasant";
  return "Review score";
}
export function RatingBadge({
  score,
  count,
  word,
  lg,
}: {
  score: number;
  count?: number;
  word?: string;
  lg?: boolean;
}) {
  if (!score) return null;
  return (
    <span className={`rate-badge ${lg ? "lg" : ""}`}>
      <span className="rate-num">{score % 1 === 0 ? score : score.toFixed(1)}</span>
      <span className="rate-word">
        {word || scoreWord(score)}
        {count != null && <small> · {count.toLocaleString()} reviews</small>}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------
   Stars — gold star row
--------------------------------------------------------------- */
export function Stars({ count }: { count: number }) {
  const n = Math.max(0, Math.min(5, Math.round(count)));
  if (!n) return null;
  return (
    <span className="hotel-stars" aria-label={`${n} star`} style={{ color: "var(--gold)", display: "inline-flex" }}>
      {Array.from({ length: n }).map((_, i) => (
        <Icon key={i} name="starf" size={15} />
      ))}
    </span>
  );
}

/* ---------------------------------------------------------------
   ImageGallery — 1 large + 2x2 + "show all" → lightbox
--------------------------------------------------------------- */
export function ImageGallery({ images, alt = "" }: { images: string[]; alt?: string }) {
  const [box, setBox] = useState<number | null>(null);
  const list = images.filter(Boolean);
  const shown = list.slice(0, 5);

  useEffect(() => {
    if (box == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBox(null);
      if (e.key === "ArrowRight") setBox((b) => (b == null ? b : (b + 1) % list.length));
      if (e.key === "ArrowLeft") setBox((b) => (b == null ? b : (b - 1 + list.length) % list.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [box, list.length]);

  if (!shown.length) return null;
  return (
    <>
      <div className="travel-gallery">
        {shown.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt={`${alt} photo ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} onClick={() => setBox(i)} style={{ cursor: "zoom-in" }} />
        ))}
        {list.length > 1 && (
          <button className="ota-gallery-more" onClick={() => setBox(0)}>
            <Icon name="camera" size={15} /> Show all {list.length} photos
          </button>
        )}
      </div>
      {box != null && (
        <div className="lightbox" onClick={() => setBox(null)} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <button className="lb-nav prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setBox((b) => (b == null ? b : (b - 1 + list.length) % list.length)); }} style={lbNav("left")}>
            <Icon name="back" size={26} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[box]} alt={`${alt} photo ${box + 1}`} onClick={(e) => e.stopPropagation()} />
          <button className="lb-nav next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setBox((b) => (b == null ? b : (b + 1) % list.length)); }} style={lbNav("right")}>
            <Icon name="chevron" size={26} />
          </button>
        </div>
      )}
    </>
  );
}
function lbNav(side: "left" | "right"): React.CSSProperties {
  return {
    position: "fixed",
    top: "50%",
    [side]: 18,
    transform: "translateY(-50%)",
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: 0,
    background: "rgba(255,255,255,.92)",
    color: "var(--ink)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  } as React.CSSProperties;
}

/* ---------------------------------------------------------------
   StickyTabs — anchor tabs with IntersectionObserver scrollspy
--------------------------------------------------------------- */
export interface TabItem {
  id: string;
  label: string;
  ai?: boolean;
}
export function StickyTabs({ tabs, rightSlot }: { tabs: TabItem[]; rightSlot?: ReactNode }) {
  const [active, setActive] = useState(tabs[0]?.id);
  useEffect(() => {
    const els = tabs
      .map((t) => document.getElementById(t.id))
      .filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [tabs]);
  return (
    <div className="hotel-tabs">
      <div className="hh-wrap inner" style={{ display: "flex", alignItems: "center" }}>
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={`${t.ai ? "ai" : ""} ${active === t.id ? "active" : ""}`}
          >
            {t.ai && <Icon name="sparkles" size={14} className="ai-spark" />}
            {t.label}
          </a>
        ))}
        {rightSlot && <span style={{ marginLeft: "auto" }}>{rightSlot}</span>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Skeletons
--------------------------------------------------------------- */
export function Skeleton({ w, h, r, style }: { w?: number | string; h?: number | string; r?: number | string; style?: React.CSSProperties }) {
  return <span className="ota-skel" style={{ display: "block", width: w ?? "100%", height: h ?? 14, borderRadius: r, ...style }} />;
}
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}
export function SkeletonCard() {
  return (
    <div className="ota-skel-card">
      <span className="ota-skel ota-skel-img" />
      <div className="ota-skel-body">
        <Skeleton w="70%" h={16} />
        <Skeleton w="45%" />
        <Skeleton w="55%" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   AiAnswer — emerald callout for Ask-AI responses
--------------------------------------------------------------- */
export function AiAnswer({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <div className="ota-ai-answer" role="status" aria-labelledby={id}>
      <span className="ota-ai-ico"><Icon name="sparkles" size={18} /></span>
      <p id={id}>{children}</p>
    </div>
  );
}
