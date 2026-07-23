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
