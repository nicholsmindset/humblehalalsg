# design-sync notes — humblehalalsg

- This is a Next.js **application**, not a component library: no dist, no
  `main`/`module`/`exports` in package.json. The converter runs in
  **synth-entry mode** over `components/` (`srcDir: "components"`), with
  `tsconfig.json` supplying the `@/*` alias.
- CSS is 13 sheets under `styles/` loaded via Next layouts. Cascade order
  matters (root layout order, then route-scoped blog/hawker/tools). The
  committed `.design-sync/build-css.mjs` (wired as `buildCmd`) concatenates
  them into `.design-sync/.cache/entry.css` = `cfg.cssEntry`. Re-run it after
  any `styles/*.css` change; new sheets must be added to its ORDER list.
- Fonts load via `next/font/google` in `app/layout.tsx` (no local font files;
  exposed as `--font-*` vars). `.design-sync/fetch-fonts.mjs` downloaded the
  six families (Spectral, Hanken Grotesk, Cormorant Garamond, Libre Caslon
  Text, Newsreader, Amiri incl. arabic subset) into `.design-sync/fonts/`
  (committed, ~1.1 MB) wired via `extraFonts`. All `var(--font-*)` uses in the
  CSS carry family-name fallbacks; the entry.css bridge also defines the vars.
  The "tweakable alternate serifs" `<link>` from layout.tsx is NOT shipped.
- `components/screens/` are full app screens (admin/*, etc.) — client
  components that fetch `/api/...` on mount. They ship in the bundle but
  cannot render meaningful static previews.
- Clerk (12 files), Supabase (7), Leaflet maps (2) importers exist; expect
  provider/context issues in previews for those.

## Authored-preview learnings (fan-out waves A–D, 42 components)

- **Context-reading components need `<PreviewShell>`** (from fixtures, on the
  bundle): ListingCard, SearchBar, Breadcrumbs, HelpCallout — they call
  `useApp()`/`useDirectory()`. Everything else authored so far is pure/props-
  driven and must NOT be wrapped.
- **`position:fixed` overlays clip in capture** (Toast): a transformed capture
  ancestor becomes the containing block, so the pinned pill lands off-frame.
  The Toast preview neutralizes it with a scoped `<style>` (static position).
  Any future fixed/sticky overlay (modals, sticky bars, NotificationBell) will
  hit this — render it in normal flow inside the preview.
- **Mobile-only chrome hidden at capture viewport** (MobileHeader): `.mob-head`
  is `display:none` above 861px and the capture viewport is 900px. The preview
  forces it visible via a scoped `<style>`. Cleaner alternative if it recurs:
  `cfg.overrides.<Name>.viewport = "390x780"`.
- **Flag-gated components render null in preview** (HelpCallout, HalalChip's
  flag path): `/api/flags` never resolves in-preview, so flags stay at
  `DEFAULT_FLAGS` (all OFF). Use only always-on/no-flag features, or pass data
  that doesn't depend on a flag.
- **Fetch-only components can't show populated state**: PlanBenefitsCard fetches
  `/api/owner/entitlements` with no data prop → only its loading skeleton
  renders. Left as a FLOOR CARD (its `.d.ts` contract is still shipped via
  dtsPropsFor). Same risk for any component whose only data path is a mount
  fetch with no prop override.
- **`next/image` is stubbed to `<img>`**; previews pass `image:""` and let the
  component's own placeholder render, or use an inline SVG data-URI (AuthorBio
  avatar) — no network in captures.
- **Real component-CSS nit (not a sync bug, for the app owner):** AuthorBio's
  two `.author-links` anchors render with no separator gap
  ("instagram.comlinkedin.com") — missing gap in the component CSS.
- **41 components have hand-written `dtsPropsFor`** (real API contracts) merged
  from the wave learnings; the ~226 non-authored components keep the synth-entry
  `[key: string]: unknown` fallback + JSDoc-derived `.prompt.md`.
- **APP SOURCE FIX (lib/airports.ts:184):** the diacritics-strip regex was
  written with literal U+0300–U+036F combining chars (`/[̀-ͯ]/g`). esbuild
  preserves regex literals verbatim, so the bundle carried raw UTF-8 bytes;
  when a classic `<script src>` loads the bundle from a document WITHOUT a
  utf-8 charset (validate's [BUNDLE_EXPORT] smoke test does exactly this), the
  browser decodes them as Latin-1 and the character-class range reverses →
  "Range out of order" → the whole IIFE throws → window.HumbleHalal never
  populates → all 270 export as broken. Rewrote the range as ASCII escapes
  `/[\\u0300-\\u036f]/g` (byte-identical match, encoding-immune). The real DS
  pane loads previews from `<meta charset=utf-8>` HTML so it was never broken
  there — but the ASCII form is strictly more robust. If a future edit
  reintroduces literal combining chars, the smoke test will fail again.
- **Excluded LeafletMap + InsightsChart** (`componentSrcMap: null`): both are
  `export default function` components consumed only via
  `dynamic(() => import(...), {ssr:false})`. Synth-entry's `export * from`
  does NOT re-export defaults, so they were discovered as component names but
  never landed on window.HumbleHalal → [BUNDLE_EXPORT] flagged them. They are
  ssr:false Leaflet/recharts wrappers that can't static-render anyway. If you
  want them in the DS later, re-export them as named exports and add via
  extraEntries. (Any future default-export-only component hits the same trap.)
- **[FONT_MISSING] "Scheherazade New"** — ACCEPTED as system fallback. It is
  only the *tertiary* fallback in the Arabic font stack (`var(--font-quran),
  "Amiri", "Scheherazade New", serif`); Amiri (primary) IS shipped, so
  Scheherazade is never reached. Not worth shipping a second Arabic face.
- **[TOKENS_MISSING] 7 vars** (--emerald-800, --border, --green, --surface,
  --green-pale, --shadow-sm, --muted) are referenced by blog.css/styles.css
  but never defined in the app's own stylesheets (broken in the app too).
  Defined in `.design-sync/build-css.mjs`'s FONT_BRIDGE :root, mapped to the
  obvious palette equivalents, so the DS bundle is complete.
- **Stub aliases** (`.design-sync/tsconfig.json` + `.design-sync/stubs/`,
  wired via `cfg.tsconfig` — the converter's esbuild paths plugin resolves
  them before node_modules): `next/link`→anchor, `next/image`→img,
  `next/navigation`→inert router hooks, `next/dynamic`→React.lazy,
  `next/script`→null, `next/og`→throwing ImageResponse, `@clerk/nextjs`→
  loaded-signed-out session. Without these, esbuild fails on node builtins
  (`node:async_hooks` via Clerk server barrel; fs/stream/zlib via next/og's
  gzip-size chain). The DS rendering environment has no Next runtime or
  Clerk keys, so signed-out/anchor semantics are correct there, not a hack.
  If a future component imports a new server-only module, add a stub +
  paths entry rather than excluding the component.
- **`.d.ts` props fall back to `[key: string]: unknown` for ALL components.**
  Root cause: synth-entry mode has no shipped `.d.ts`, and the DTS project's
  `findTypesRoot` picks `lib/` (first existing candidate: build/ts, dist/types,
  types, **lib**, dist) — a data/utility tree, not `components/`. The props
  project only ever loads `.d.ts` files, never the `.tsx` sources, so nothing
  resolves. This is documented-expected for synth-entry ("contracts will be
  weaker"). Remedy: hand-write `cfg.dtsPropsFor.<Name>` for the components that
  matter (done for the authored core set — the source is read during preview
  authoring anyway). The ~230 non-authored components keep the `unknown`
  fallback and rely on their `.prompt.md` (JSDoc-derived) for guidance.
- **`process` shim** (`.design-sync/process-shim.ts`, FIRST in `extraEntries`):
  the app's lib modules read `process.env.*` at module scope, but esbuild's
  browser platform ships no `process`, so all 270 previews failed with
  "process is not defined". The shim has zero imports and the converter emits
  `export * from <extraEntry>` ahead of the main entry, so it evaluates first
  in the IIFE and defines a global `process` (env → undefined for every key).
  Order matters: process-shim MUST precede fixtures.tsx (which imports app
  modules) in the extraEntries array.
- **`.design-sync/fixtures.tsx`** (second `extraEntries` item): realistic
  Listing/category/area seed data + a `PreviewShell` (AppProvider >
  DirectoryProvider) so context-reading previews (ListingCard, SearchBar)
  render in real context. Authored previews import from it via the bundle
  global (it's an extraEntry, so on window.HumbleHalal).
- `cfg.entry` is deliberately `./dist/index.js` (nonexistent): with soft
  resolution it routes PKG_DIR to the repo root (the `--entry` package.json
  walk) and then falls through to synth-entry mode. Without it the converter
  looks for `node_modules/humblehalalsg` and crashes.
