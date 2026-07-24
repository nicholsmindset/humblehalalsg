# Humble Halal — building with this design system

Humble Halal is a Singapore halal-lifestyle product (food directory, events,
travel, owner tools). Its look is **warm editorial**: a deep teal (`--emerald`)
and saffron (`--gold`) palette on porcelain cream, Spectral serif headings over
Hanken Grotesk body text. Build on-brand by reusing the real components below
and styling your own layout glue with the tokens and classes named here — never
invent a parallel class vocabulary.

## Setup & wrapping

Components split into **pure** (most primitives) and **context-reading** ones.
A context-reading component calls `useApp()` (navigation, saved items, flags,
toasts) or `useDirectory()` (the listings catalog) and will throw
`useApp must be used within AppProvider` if rendered bare. Wrap any screen or
composition that includes one in the app providers (both are real exports):

```jsx
import { AppProvider, DirectoryProvider, ListingCard } from "<this DS>";

<AppProvider>
  <DirectoryProvider listings={listings} categories={categories} areas={areas}>
    <ListingCard item={listing} />
  </DirectoryProvider>
</AppProvider>
```

Pure components (Badge, Rating, StatCard, Icon, Toast, Empty, SectionHead,
CouponCard, badges/chips, most cards) need no provider. Each component's
`.prompt.md` states whether it reads context.

## The styling idiom: semantic classes + CSS custom properties

This is **NOT** a utility-class framework (no Tailwind) and **NOT** a props-based
theme. Components carry semantic `className`s defined in the shipped stylesheet,
and everything is themed through **CSS custom properties** (`var(--token)`). Style
your own layout with the same tokens and the shared class families:

**Design tokens** (use `var(--…)`, never hard-coded hex):
- Color: `--emerald` `#12525B` (+`-700/-600/-300/-100/-50`), `--gold` `#C97D3F`
  (+`-800/-700/-100/-50`), `--cream` `#F8F6F1` (+`-200/-300`), `--ink` `#1F2933`
  / `--ink-soft` / `--ink-faint`, `--white`, `--line` / `--line-strong`,
  `--danger`, `--warn`.
- Type: `--serif` (Spectral, headings/values), `--sans` (Hanken Grotesk, body).
- Radius: `--r-sm` 10px, `--r-md` 14px, `--r-lg` 20px, `--r-xl` 28px,
  `--r-pill` 999px.
- Elevation: `--sh-sm`, `--sh-md`, `--sh-lg`, `--sh-emerald`.
- Spacing: `--space-1`…`--space-6` (4/8/12/16/24/32px).

**Shared class families** (compose these for your own markup):
- Buttons: `btn` + one of `btn-primary` / `btn-soft` / `btn-ghost`, plus
  `btn-sm` for the compact size.
- Surfaces: `card`, `card-hover` (lift on hover); listing surfaces use
  `listing` / `listing-feat`; KPI tiles use `statx`.
- Status: `badge` (halal/ownership pills), `chip`, `tag`, `hs-pill`
  (halal-confidence pill).
- Structure: `section-head` (title + optional action row), `empty` (empty
  state), `toast` (transient confirmation), `cat-btn` (category tile).

## Where the truth lives

- The full token + class source is the bound stylesheet `styles.css` and its
  `@import` closure (`_ds_bundle.css`, `tokens/`) — read it before styling.
- Each component's real props and usage examples are in its `.prompt.md` and
  `.d.ts`. Prefer those over guessing prop names.

## Idiomatic snippet

```jsx
import { StatCard, SectionHead } from "<this DS>";

<section style={{ background: "var(--cream)", padding: "var(--space-6)" }}>
  <SectionHead title="This month" action="View report" />
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)" }}>
    <StatCard label="Halal listings" value="1,284" icon="store" />
    <StatCard label="Monthly views" value="48.2k" delta={12.4} icon="eye" />
    <StatCard label="Muslim-owned" value="61%" delta={3.1} icon="shield-check" />
  </div>
</section>
```
