---
name: Humble Halal
description: Singapore's honest halal & Muslim-owned discovery platform — editorial trust on porcelain.
colors:
  teal: "#12525B"
  teal-700: "#0D424A"
  teal-600: "#17636D"
  teal-300: "#6FA0A8"
  teal-100: "#DCE9EA"
  teal-50: "#EDF4F4"
  saffron: "#C97D3F"
  saffron-700: "#A96430"
  saffron-800: "#856520"
  saffron-100: "#F7E7D6"
  saffron-50: "#FBF2E9"
  porcelain: "#F8F6F1"
  porcelain-200: "#F0EDE4"
  porcelain-300: "#E4E0D3"
  white: "#FFFFFF"
  ink: "#1F2933"
  ink-soft: "#586471"
  ink-faint: "#626C78"
  line: "#ECE7DB"
  line-strong: "#DED7C7"
  danger: "#B4453A"
  warn: "#B9863B"
typography:
  display:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(2.2rem, 5vw, 4.2rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Spectral, Georgia, serif"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "1.12rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.58rem"
    fontWeight: 600
    letterSpacing: "0.22em"
  quran:
    fontFamily: "Amiri, Scheherazade New, serif"
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.teal-700}"
  button-gold:
    backgroundColor: "{colors.saffron}"
    textColor: "#2e2205"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.teal}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "11px 20px"
  chip:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "8px 15px"
  chip-active:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.porcelain}"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "14px 15px 16px"
  badge-muis:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "4px 10px 4px 8px"
  badge-owned:
    backgroundColor: "{colors.teal-50}"
    textColor: "{colors.teal}"
    rounded: "{rounded.pill}"
    padding: "4px 10px 4px 8px"
  badge-friendly:
    backgroundColor: "#F2F0EA"
    textColor: "#595241"
    rounded: "{rounded.pill}"
    padding: "4px 10px 4px 8px"
---

# Design System: Humble Halal

<!-- Creative North Star, color character names, and the anti-reference were INFERRED from
     evidence (PRODUCT.md, styles/styles.css, docs/design/palette-2026-07.md), not confirmed in
     a design interview. Re-run /impeccable document to revise the qualitative language with the team. -->

## Overview

**Creative North Star: "The Trusted Guide"**

Humble Halal reads like a calm, editorial almanac for the Singapore Muslim community — a place
whose whole job is to tell you the *truth* about halal status and let you decide with confidence.
The system is built on a warm **porcelain cream** ground (#F8F6F1), not clinical white, with a
grounded **deep teal** (#12525B) doing the trust-bearing work and a single **saffron-terracotta**
(#C97D3F) accent used sparingly for warmth and wayfinding. Headlines are set in the **Spectral**
serif — reference-book, considered, unhurried — over **Hanken Grotesk** body text that stays
quiet and legible on a phone held mid-decision. A subtle girih lattice appears as texture, never
ornament. The result should feel trustworthy, humble, and human — the opposite of a loud
marketplace or a generic AI-SaaS template.

This world was deliberately chosen (July 2026 revamp, `docs/design/palette-2026-07.md`) to be
**distinct from generic AI-generated SaaS mockups**: no Inter/system default type, no
purple-to-blue gradients, no pure-white/pure-gray flatness. That rejection is the explicit
anti-reference.

**Key Characteristics:**
- Warm porcelain ground, never clinical white; every neutral is tinted, never pure gray/black.
- Deep teal carries trust; saffron is a rare accent, not a second brand color.
- Editorial serif (Spectral) for voice; grotesk (Hanken) for calm utility; Amiri for Arabic.
- Honest, graduated trust badges are the signature component — the product's soul in a chip.
- Mobile-first, decision-fast, WCAG-AA throughout.

## Colors

A warm, grounded palette: porcelain neutrals, one trust-bearing teal, one saffron accent, tinted
inks. Named for their true hue (the CSS variables historically use `--emerald`/`--gold`, which
now hold teal and saffron — see Do's & Don'ts).

### Primary
- **Deep Teal** (#12525B, `--emerald`): the trust workhorse — primary buttons, active nav, logo
  mark, `MUIS Certified` badge fill, focus rings, links on hover. Darker steps `teal-700` (#0D424A)
  and `teal-600` (#17636D) for hover/gradient depth; `teal-300` (#6FA0A8) for hairline accents;
  `teal-100`/`teal-50` for soft fills (soft buttons, owned badge, selection highlight).

### Secondary
- **Saffron Terracotta** (#C97D3F, `--gold`): the rare warm accent — the gold underline on active
  nav, `Admin Verified` badge, star ratings, gold CTA buttons. Used on a small fraction of any
  screen; its scarcity is the point. `saffron-800` (#856520) is the AA-safe variant for gold text
  on light; `saffron-700` for hover.

### Neutral
- **Porcelain** (#F8F6F1, `--cream`): the default page background and the color primary buttons
  print onto. `porcelain-200`/`porcelain-300` step it down for wells and borders.
- **Ink** (#1F2933): primary text. **Ink Soft** (#586471) and **Ink Faint** (#626C78, tuned to
  pass AA on porcelain): secondary and meta text — tinted slate, never pure gray.
- **Line** (#ECE7DB) / **Line Strong** (#DED7C7): hairline and stronger dividers/borders.

### Status
- **Danger** (#B4453A) and **Warn** (#B9863B): muted, palette-harmonized — never pure red/amber.

### Named Rules
**The Tinted-Neutral Rule.** No pure black, white, or gray touches the UI. Text is tinted slate,
backgrounds are porcelain, shadows are teal-tinted rgba. Pure `#000`/`#666`/`#fff` on a surface is
a bug.

**The One-Accent Rule.** Saffron appears on ≤10% of any screen — an underline, a badge, a star, a
single CTA. If two things are fighting to be gold, one of them is wrong.

## Typography

**Display Font:** Spectral (with Georgia fallback)
**Body Font:** Hanken Grotesk (with system-ui fallback)
**Arabic Font:** Amiri (with Scheherazade New fallback), via `--font-quran`

**Character:** An editorial serif + humanist grotesk pairing that reads considered and trustworthy
rather than techy or promotional. Distinctive and intentional — explicitly not Inter/Geist/Arial.

### Hierarchy
- **Display** (Spectral 600, clamp(2.2rem, 5vw, 4.2rem), line-height 1.12, letter-spacing -0.01em):
  hero and page titles.
- **Headline** (Spectral 600, line-height 1.12): `h2`/`h3` section heads.
- **Title** (Spectral 600, ~1.12rem): listing/business names, card titles.
- **Body** (Hanken Grotesk 400, 1rem/16px, line-height 1.5): all running text and UI.
- **Label** (Hanken Grotesk 600, 0.58rem, letter-spacing 0.22em, uppercase): kickers, the logo
  eyebrow, category eyebrows.

### Named Rules
**The Serif-Headline Rule.** Headlines (`h1`–`h4`) are always Spectral 600 with -0.01em tracking
and ~1.12 line-height. Body and UI are always Hanken. Don't set headlines in the grotesk or body in
the serif.

## Layout

Centered single column, max-width 1180px (`--maxw`), 20px gutters (16px under 380px). Vertical
rhythm on a 4/8 spacing scale (`--space-1..6`: 4/8/12/16/24/32px); sections are 40px vertical
(28px on phones). **Mobile-first with a hard 861px breakpoint**: below it, a sticky mobile top bar
+ bottom tab bar + slide-in drawer; at/above it, a sticky blurred desktop top nav. Content never
scrolls horizontally (`overflow-x: clip` safety net). Fixed-bar heights are tokens
(`--nav-h` 64, `--tab-h` 68, `--mobilebar-h` 56).

## Elevation & Depth

Mostly flat on porcelain, with soft **teal-tinted** shadows for lift on interactive surfaces —
depth is a response to state (hover/focus), not a default. Frosted glass (`backdrop-filter: blur`)
on the sticky nav bars over a translucent porcelain/white.

### Shadow Vocabulary
- **sm** (`0 1px 2px rgba(31,41,51,.05), 0 1px 3px rgba(31,41,51,.06)`): resting cards, buttons.
- **md** (`0 4px 14px rgba(31,41,51,.07), 0 2px 6px rgba(31,41,51,.05)`): raised panels.
- **lg** (`0 18px 40px rgba(31,41,51,.12), 0 6px 14px rgba(31,41,51,.06)`): hover cards, drawers,
  overlays.
- **teal** (`0 12px 28px rgba(18,82,91,.22)`): the branded glow under a primary button on hover and
  the mobile add-button.

### Named Rules
**The Lift-On-Intent Rule.** Cards sit flat (sm) at rest and rise to `lg` with a -2px translate
only on hover/focus. Motion and shadow appear together, as feedback — never as decoration.

## Shapes

A soft, rounded-but-not-bubbly language. Radius scale `--r-sm` 10 / `--r-md` 14 / `--r-lg` 20 /
`--r-xl` 28, plus a full `--r-pill` (999px). **Pills for anything interactive-and-inline**
(buttons, chips, badges); **rounded rectangles (lg, 20px) for cards and media**; medium (14px) for
menu items and inputs. The girih lattice (a subtle diamond/star SVG texture) is the one recurring
motif, used at low opacity as a background wash.

## Components

### Buttons
- **Shape:** full pill (`--r-pill`), 1px transparent border, ~11px 20px padding, Hanken 600 .94rem.
- **Primary:** teal fill, porcelain text, `sm` shadow → on hover teal-700 with the branded teal
  glow and a -1px lift.
- **Gold:** saffron fill with near-black `#2e2205` text (AA-safe) → hover saffron-700.
- **Outline / Soft / Ghost:** white-with-teal-border / teal-50 fill / transparent — descending
  emphasis. Sizes `sm` and `lg`; `btn-block` for full width; 0.5 opacity when disabled.

### Chips
- White pill, `line-strong` border, ink-soft label → hover lifts border to teal-300. **Active** =
  teal fill + porcelain text, with any leading icon turning saffron.

### Trust Badges (signature component)
The graduated, honest trust system — the product's core idea rendered as a chip. Small pill,
700-weight, ~0.74rem:
- **MUIS Certified** (`badge--muis`): solid teal fill, white text, teal-tinted shadow —
  unmistakable, the only "official" tier.
- **Admin Verified** (`badge--admin`): solid saffron fill, near-black text.
- **Muslim-Owned** (`badge--owned`): teal-50 fill, teal text, teal-300 border — verified-adjacent.
- **Halal-Friendly / No-Pork** (`badge--friendly`): muted oat neutral (#F2F0EA / #595241),
  visibly "not certified".
- **Pending** (`badge--pending`): dashed muted border.

### Cards
- **Corner:** `lg` (20px), 1px `--line` border, white background, `sm` shadow, clipped overflow.
- **Hover (`card-hover`):** rises to `lg` shadow + -2px translate + `line-strong` border; uses a
  stretched-link pattern (`.card-stretch`) for a full-card crawlable/keyboard link without nesting
  interactives. Listing media is 16:10; body padding 14/15/16.

### Inputs / Fields
- Inherit body font at 1rem, ink text; medium radius; teal `:focus-visible` ring (2px, 2px offset).

### Navigation
- **Desktop:** sticky frosted top nav (blur 12px over translucent porcelain), Hanken 700 links in
  ink-soft → teal on hover/active, with a saffron underline on the active item.
- **Mobile:** frosted bottom tab bar (active = teal) with a raised teal add-button, plus a sticky
  top bar + right-side slide-in drawer (teal-50 hover rows).

### Rating
Saffron star + 700 value; a distinct **"New"** state (teal, no star fill) for listings with no
reviews — never a fabricated 4.5.

## Do's and Don'ts

### Do:
- **Do** ground every surface on porcelain (#F8F6F1) and keep all neutrals tinted (slate inks,
  teal-tinted shadows). Follow **The Tinted-Neutral Rule**.
- **Do** reserve saffron for a single accent per view (**The One-Accent Rule**); teal carries
  trust and structure.
- **Do** set headlines in Spectral 600 (-0.01em) and body/UI in Hanken (**The Serif-Headline Rule**).
- **Do** keep the graduated badge hierarchy visually honest: `MUIS Certified` is solid and singular;
  self-declared tiers read as muted and clearly not-official. This mirrors PRODUCT.md's positioning
  and must never be blurred.
- **Do** resolve brand color from the CSS custom properties in `styles/styles.css`, and keep AA
  contrast (the codebase already encodes hard-won AA fixes — e.g. gold text uses `saffron-800`,
  gold buttons use near-black text).

### Don't:
- **Don't** reintroduce the generic AI-SaaS look the July 2026 revamp rejected: no Inter/system
  default headlines, no purple/blue gradients, no pure-white/pure-gray flatness.
- **Don't** promote saffron into a co-primary or use bounce/elastic easing (transitions are the
  standard `cubic-bezier(.4,0,.2,1)` at ~.15–.22s).
- **Don't** hard-code brand hex values in new code — several legacy files still do (see below);
  don't add more. And **don't** trust the token *names*: `--emerald` holds teal (#12525B), not
  emerald, and `--gold` holds saffron.
- **Don't** style a self-declared listing to look certified, or invent a rating/verdict — honesty
  is an identity rule, not just copy.
