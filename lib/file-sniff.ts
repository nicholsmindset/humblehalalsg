/* Magic-byte file-type detection. Never trust the client-declared MIME
   (file.type) alone — a .png-named file with `image/png` type can carry
   arbitrary bytes. We sniff the actual signature and store with the DETECTED
   content-type + extension. No dependency — 5 signatures cover what we accept. */

export type SniffedType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "application/pdf";

const EXT: Record<SniffedType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

/** Detected type from the leading bytes, or null if unrecognised. */
export function sniffFileType(b: Uint8Array): SniffedType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return "image/png";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // "WEBP"
  ) return "image/webp";
  // ISO-BMFF: bytes 4..7 = "ftyp", major brand at 8..11 starts with avif/avis.
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
  }
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}

/** The detected type ONLY if it's in `allowed`, else null. */
export function sniffAllowed(b: Uint8Array, allowed: readonly string[]): SniffedType | null {
  const t = sniffFileType(b);
  return t && allowed.includes(t) ? t : null;
}

/** Canonical extension for a sniffed type (jpg, png, webp, avif, pdf). */
export function extForType(t: SniffedType): string {
  return EXT[t];
}
