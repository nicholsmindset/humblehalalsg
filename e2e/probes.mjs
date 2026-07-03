/* Mobile-audit probes. Each export is a SELF-CONTAINED function passed to
   page.evaluate() — it runs in the browser, so no imports and no outer-scope
   references. Shared by scripts/mobile-audit.mjs and e2e/mobile.spec.ts.

   Why element-level: styles/styles.css sets html,body { overflow-x: clip },
   so the page never scrolls sideways — over-wide elements are silently CUT
   OFF at the viewport edge. document.scrollWidth is therefore always clean;
   only per-element rects reveal clipped content. */

/* Containers where children are MEANT to extend past the viewport (swipe rails,
   contained tables). An element inside one of these — or inside any computed
   overflow-x:auto|scroll container that actually scrolls — is not a defect. */
export const SCROLLER_ALLOWLIST = [
  ".ota-track", ".pillbar", ".tbl-scroll", ".flt-cal", ".dash-tabs",
  ".detail-tabs", ".hotel-tabs", ".weather-row", ".map-cc-row", ".ota-cal-scroll",
];

/* Selectors whose targets are conversion-critical: these hard-fail CI when
   under 44px; everything else warns. */
export const PRIMARY_CTA_SELECTOR = [
  ".btn:not(.btn-sm):not(.btn-ghost)", "[type=submit]",
  ".detail-stickybar a", ".detail-stickybar button",
  ".evt-stickybar a", ".evt-stickybar button",
  ".fp-apply", ".sb-btn",
].join(",");

/** Elements whose border-box crosses the viewport's horizontal edges with no
 *  intermediate scroll container to reach them → clipped by the root = cut off.
 *  Returns outermost offenders only. */
export function overflowProbe(allowSelector) {
  const cw = document.documentElement.clientWidth;
  const cssPath = (el) => {
    const parts = [];
    let n = el;
    while (n && n !== document.body && parts.length < 5) {
      let p = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(`${p}#${n.id}`); break; }
      const cls = [...n.classList].slice(0, 2).join(".");
      if (cls) p += `.${cls}`;
      parts.unshift(p);
      n = n.parentElement;
    }
    return parts.join(" > ");
  };
  const isScroller = (el) => {
    const cs = getComputedStyle(el);
    return (cs.overflowX === "auto" || cs.overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1;
  };
  // An intermediate clipping ancestor (overflow hidden/clip on a normal box,
  // e.g. a card cropping its cover image) means the root doesn't do the
  // cutting — that's a design crop, not page-edge cut-off.
  const isClipper = (el) => {
    if (el === document.body || el === document.documentElement) return false;
    const cs = getComputedStyle(el);
    return cs.overflowX === "hidden" || cs.overflowX === "clip";
  };
  const handled = (el) => {
    let n = el.parentElement;
    while (n && n !== document.documentElement) {
      if ((allowSelector && n.matches(allowSelector)) || isScroller(n) || isClipper(n)) return true;
      n = n.parentElement;
    }
    return false;
  };
  const flagged = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest('[aria-hidden="true"],[hidden],script,style,noscript')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right <= cw + 1 && r.left >= -1) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    if (allowSelector && el.matches(allowSelector)) continue;
    if (isScroller(el)) continue; // the scroller itself may be full-bleed by design
    if (handled(el)) continue;
    flagged.push({ el, r });
  }
  const set = new Set(flagged.map((f) => f.el));
  const out = [];
  for (const { el, r } of flagged) {
    let anc = el.parentElement, covered = false;
    while (anc) { if (set.has(anc)) { covered = true; break; } anc = anc.parentElement; }
    if (covered) continue;
    out.push({
      selector: cssPath(el),
      left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
      clientWidth: cw,
      overflowPx: Math.round(Math.max(r.right - cw, 0) + Math.max(-r.left, 0)),
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70),
    });
  }
  return out;
}

/** Interactive elements measured by border-box (padding counts toward the hit
 *  area). A nested control passes if an interactive ancestor is ≥44 both axes
 *  (the ancestor is the real target). Tiers: fail <24 (WCAG 2.5.8), warn <44,
 *  note <48 (Material). */
export function tapTargetProbe(primaryCtaSelector) {
  const SEL = 'a[href],button,input,select,textarea,summary,[role=button],[role=tab],[role=link],[role=checkbox],[role=menuitem],[role=switch]';
  const cssPath = (el) => {
    const parts = [];
    let n = el;
    while (n && n !== document.body && parts.length < 5) {
      let p = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(`${p}#${n.id}`); break; }
      const cls = [...n.classList].slice(0, 2).join(".");
      if (cls) p += `.${cls}`;
      parts.unshift(p);
      n = n.parentElement;
    }
    return parts.join(" > ");
  };
  const visible = (el) => {
    if (el.closest('[aria-hidden="true"],[hidden]')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  };
  const out = [];
  for (const el of document.querySelectorAll(SEL)) {
    if (el.disabled || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w >= 48 && h >= 48) continue;
    // WCAG 2.5.8 inline exception: links inside a sentence (size constrained by
    // the surrounding line-height) are exempt — skip to avoid flooding triage.
    if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.parentElement) {
      let inSentence = false;
      for (const n of el.parentElement.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) { inSentence = true; break; }
      }
      if (inSentence) continue;
    }
    // Covered by a big-enough interactive ancestor? (e.g. input inside a 44px label row)
    let anc = el.parentElement, coveredBy = null;
    while (anc && anc !== document.body) {
      if (anc.matches(SEL) || anc.tagName === "LABEL") {
        const ar = anc.getBoundingClientRect();
        if (ar.width >= 44 && ar.height >= 44) { coveredBy = anc; break; }
      }
      anc = anc.parentElement;
    }
    if (coveredBy) continue;
    const tier = w < 24 || h < 24 ? "fail" : w < 44 || h < 44 ? "warn" : "note";
    out.push({
      selector: cssPath(el), w, h, tier,
      primaryCta: primaryCtaSelector ? el.matches(primaryCtaSelector) : false,
      text: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 50),
    });
  }
  return out;
}

/** Visible text nodes whose computed font-size is below 12px, grouped by the
 *  parent's class chain so one CSS rule = one finding. */
export function smallTextProbe() {
  const groups = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent || !node.textContent.trim()) continue;
    const el = node.parentElement;
    if (!el || el.closest('[aria-hidden="true"],[hidden],script,style,noscript')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const px = parseFloat(cs.fontSize);
    if (px >= 12) continue;
    const key = `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")}|${px.toFixed(1)}`;
    const g = groups.get(key) || { classChain: key.split("|")[0], px: Number(px.toFixed(1)), count: 0, sample: "" };
    g.count += 1;
    if (!g.sample) g.sample = node.textContent.trim().replace(/\s+/g, " ").slice(0, 50);
    groups.set(key, g);
  }
  return [...groups.values()];
}

/** Inputs that would trigger iOS zoom-on-focus (font-size < 16px on a text-entry
 *  control). Select elements zoom too. */
export function inputZoomProbe() {
  const out = [];
  const cssPath = (el) => {
    let p = el.tagName.toLowerCase();
    const cls = [...el.classList].slice(0, 2).join(".");
    if (cls) p += `.${cls}`;
    const parent = el.parentElement;
    const pc = parent ? [...parent.classList].slice(0, 1).join(".") : "";
    return pc ? `.${pc} > ${p}` : p;
  };
  for (const el of document.querySelectorAll("input,select,textarea")) {
    if (el.type === "hidden" || el.disabled) continue;
    if (["checkbox", "radio", "range", "file", "submit", "button"].includes(el.type)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const px = parseFloat(cs.fontSize);
    if (px < 16) out.push({ selector: cssPath(el), px: Number(px.toFixed(1)), placeholder: (el.getAttribute("placeholder") || el.getAttribute("aria-label") || "").slice(0, 40) });
  }
  return out;
}
