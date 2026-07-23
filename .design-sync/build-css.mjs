// Assembles the design-sync CSS entry for this repo. The app loads its 13
// stylesheets through Next layouts (root layout order, then route-scoped
// blog/hawker/tools sheets), so the DS bundle needs the same cascade order in
// one file — cfg.cssEntry content is appended verbatim into _ds_bundle.css,
// which is why this concatenates instead of @importing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');

// Root-layout order (app/layout.tsx), then the route-scoped sheets in the
// order Next mounts them after the root cascade.
const ORDER = [
  'styles.css', 'ota.css', 'screens.css', 'screens2.css', 'moat.css',
  'events.css', 'travel.css', 'mobile.css', 'mobile-a11y.css', 'ads.css',
  'blog.css', 'hawker.css', 'tools.css',
];

// next/font normally injects these variables; the DS bundle ships real
// @font-face rules (fonts/fonts.css) for the same family names instead.
const FONT_BRIDGE = `:root {
  --font-spectral: 'Spectral';
  --font-hanken: 'Hanken Grotesk';
  --font-cormorant: 'Cormorant Garamond';
  --font-libre: 'Libre Caslon Text';
  --font-newsreader: 'Newsreader';
  --font-quran: 'Amiri';
}
`;

const parts = [FONT_BRIDGE];
for (const f of ORDER) {
  parts.push(`/* ── styles/${f} ── */\n` + readFileSync(join(repo, 'styles', f), 'utf8'));
}
const outFile = join(repo, '.design-sync', '.cache', 'entry.css');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, parts.join('\n'));
console.error(`entry.css: ${ORDER.length} sheets, ${(parts.join('\n').length / 1024).toFixed(0)} KB`);
