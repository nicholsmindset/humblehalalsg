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
