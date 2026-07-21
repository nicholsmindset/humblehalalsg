/* Regenerate the full brand icon set from the emblem SVG (single source of truth
   below). Run: node scripts/gen-icons.mjs
   Outputs:
     app/icon.svg               — crisp browser-tab / SVG favicon
     app/favicon.ico            — 16/32/48 packed ICO (query-less /favicon.ico for
                                  Google search + universal fallback)
     app/apple-icon.png         — 180×180 iOS home-screen icon
     public/icon-192.png        — PWA (manifest)
     public/icon-512.png        — PWA (manifest)
     public/icon-512-maskable.png — PWA maskable (padded to the safe zone)

   The emblem: a forest-green location pin holding a gold mihrab (mosque niche)
   with a green check swoosh, on a cream badge — the Humble Halal mark. Text is
   intentionally omitted (illegible below ~48px). */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CREAM = "#F5EFDF";
const GREEN = "#1C4A3A";
const GOLD = "#C9982C";

// The mark (pin + mihrab + check), no background — reused for every raster.
const MARK = `
  <path d="M256 74 C 190 74 132 132 132 206 C 132 300 200 356 256 452
           C 312 356 380 300 380 206 C 380 132 322 74 256 74 Z"
        fill="none" stroke="${GREEN}" stroke-width="30" stroke-linejoin="round"/>
  <path d="M216 252 L216 196 Q216 156 246 132 Q252 120 256 110
           Q260 120 266 132 Q296 156 296 196 L296 252 Z" fill="${GOLD}"/>
  <path d="M178 318 L236 382 L374 284" fill="none" stroke="${GREEN}"
        stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>`;

// Cream circular badge (browser tabs, favicon, apple-icon, 192/512).
const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="${CREAM}"/>${MARK}</svg>`;

// Maskable: cream fills the FULL square (corners included) so the OS mask never
// reveals transparency, and the mark is scaled to ~76% inside the safe zone.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="${CREAM}"/><g transform="translate(256 256) scale(0.76) translate(-256 -256)">${MARK}</g></svg>`;

const badge = Buffer.from(badgeSvg);
const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/** Pack PNG buffers into a single .ico (PNG-payload entries). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  const dirs = entries.map((e, i) => {
    const b = dir.subarray(i * 16, i * 16 + 16);
    b.writeUInt8(e.size >= 256 ? 0 : e.size, 0); // width
    b.writeUInt8(e.size >= 256 ? 0 : e.size, 1); // height
    b.writeUInt8(0, 2); // palette
    b.writeUInt8(0, 3); // reserved
    b.writeUInt16LE(1, 4); // color planes
    b.writeUInt16LE(32, 6); // bpp
    b.writeUInt32LE(e.buf.length, 8); // bytes
    b.writeUInt32LE(offset, 12); // offset
    offset += e.buf.length;
    return b;
  });
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.buf)]);
}

const out = async () => {
  // SVG favicon / tab icon
  await writeFile(join(root, "app/icon.svg"), badgeSvg + "\n");

  // favicon.ico — 16/32/48 (48 satisfies Google's multiple-of-48 rule)
  const icoSizes = [16, 32, 48];
  const icoBufs = await Promise.all(icoSizes.map((s) => png(badgeSvg, s)));
  await writeFile(join(root, "app/favicon.ico"), buildIco(icoSizes.map((size, i) => ({ size, buf: icoBufs[i] }))));

  // apple-icon (static replaces the ImageResponse route)
  await writeFile(join(root, "app/apple-icon.png"), await png(badgeSvg, 180));

  // PWA raster
  await writeFile(join(root, "public/icon-192.png"), await png(badgeSvg, 192));
  await writeFile(join(root, "public/icon-512.png"), await png(badgeSvg, 512));
  await writeFile(join(root, "public/icon-512-maskable.png"), await png(maskableSvg, 512));

  console.log("icons regenerated:", badge.length && "ok");
};

out().catch((e) => { console.error(e); process.exit(1); });
