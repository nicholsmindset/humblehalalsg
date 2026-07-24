// One-off fetcher: downloads the app's next/font Google families as local
// woff2 + @font-face css so the DS bundle ships self-contained fonts.
// Re-run only if app/layout.tsx changes its font lineup.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, 'fonts');
mkdirSync(outDir, { recursive: true });

// Chrome UA → css2 serves woff2 with per-subset /* comment */ blocks.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const curl = (url) => execFileSync('curl', ['-sSfL', '-A', UA, url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const curlBin = (url, dest) => execFileSync('curl', ['-sSfL', '-A', UA, '-o', dest, url]);

const FAMILIES = [
  { q: 'Spectral:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600', subsets: ['latin'] },
  { q: 'Hanken+Grotesk:wght@400;500;600;700;800', subsets: ['latin'] },
  { q: 'Cormorant+Garamond:wght@500;600;700', subsets: ['latin'] },
  { q: 'Libre+Caslon+Text:wght@400;700', subsets: ['latin'] },
  { q: 'Newsreader:wght@400;500;600;700', subsets: ['latin'] },
  { q: 'Amiri:wght@400;700', subsets: ['arabic', 'latin'] },
];

const blocks = [];
let nFiles = 0;
for (const { q, subsets } of FAMILIES) {
  const css = curl(`https://fonts.googleapis.com/css2?family=${q}&display=swap`);
  // css2 output: "/* latin */\n@font-face { ... }" repeated per subset/face.
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  for (const m of css.matchAll(re)) {
    const [, subset, face] = m;
    if (!subsets.includes(subset)) continue;
    const url = /url\((https:[^)]+\.woff2)\)/.exec(face)?.[1];
    if (!url) continue;
    const family = /font-family:\s*'([^']+)'/.exec(face)[1].replace(/\s+/g, '');
    const style = /font-style:\s*(\w+)/.exec(face)[1];
    const weight = /font-weight:\s*(\d+)/.exec(face)[1];
    const name = `${family}-${style}-${weight}-${subset}.woff2`;
    curlBin(url, join(outDir, name));
    nFiles++;
    blocks.push(`/* ${subset} */\n` + face.replace(url, `./${name}`));
  }
}
writeFileSync(join(outDir, 'fonts.css'), blocks.join('\n') + '\n');
console.error(`fonts.css: ${blocks.length} faces, ${nFiles} woff2 files`);
