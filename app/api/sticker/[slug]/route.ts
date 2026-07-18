import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Shareable/printable "Verified on Humble Halal" sticker — the owner-facing
   sibling of /api/badge/[slug] (the small website-embed badge). Owners download
   this from their dashboard to print for the storefront or share on social.
   A square 600×600 SVG (crisp at any print size; the dashboard also offers a
   client-side PNG for social). Wording is derived from admin-reviewed data and
   NEVER claims MUIS certification unless tier === "muis" — same honest ladder as
   app/api/badge/[slug]/route.ts. */

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function statusLabel(tier: string | null, attributes: string[] | null): string {
  if (tier === "muis") return "MUIS Certified Halal";
  const attrs = attributes || [];
  if (attrs.includes("muslim-owned")) return "Muslim-Owned";
  if (attrs.includes("muslim-friendly")) return "Muslim-Friendly";
  return "Halal Directory Listing";
}

function stickerSvg(name: string, label: string, theme: "light" | "dark"): string {
  // Wrap long names onto a second line so the sticker stays balanced.
  const raw = name.length > 34 ? `${name.slice(0, 33)}…` : name;
  const words = raw.split(" ");
  let l1 = raw, l2 = "";
  if (raw.length > 18 && words.length > 1) {
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length <= 18) cur = (cur + " " + w).trim();
      else { l2 += (l2 ? " " : "") + w; }
    }
    l1 = cur; l2 = l2 || "";
  }

  const cream = "#F8F6F1", emerald = "#12525B", emerald50 = "#EDF4F4", gold = "#C97D3F", goldDark = "#A96430", ink = "#1F2933";
  const bg = theme === "dark" ? emerald : cream;
  const ring = theme === "dark" ? "#1d5b48" : "#DCE9EA";
  const chipBg = theme === "dark" ? "#0D424A" : emerald50;
  const labelCol = theme === "dark" ? "#E7C79A" : goldDark;
  const nameCol = theme === "dark" ? cream : ink;
  const brandCol = theme === "dark" ? "#9fb0ac" : "#6b7a78";
  const dividerCol = theme === "dark" ? "#1d5b48" : "#E4E0D3";
  const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const l2y = 382;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-label="${esc(label)} — ${esc(raw)} on Humble Halal">
  <rect x="8" y="8" width="584" height="584" rx="52" fill="${bg}" stroke="${ring}" stroke-width="4"/>
  <circle cx="300" cy="182" r="88" fill="${chipBg}"/>
  <path d="M328 138a56 56 0 1 0 22 76 62 62 0 0 1-22-76z" fill="none" stroke="${gold}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="300" y="300" text-anchor="middle" font-family="${font}" font-size="27" font-weight="800" letter-spacing="1.5" fill="${labelCol}">${esc(label.toUpperCase())}</text>
  <text x="300" y="${l2 ? "336" : "352"}" text-anchor="middle" font-family="${font}" font-size="40" font-weight="800" fill="${nameCol}">${esc(l1)}</text>
  ${l2 ? `<text x="300" y="${l2y}" text-anchor="middle" font-family="${font}" font-size="40" font-weight="800" fill="${nameCol}">${esc(l2)}</text>` : ""}
  <line x1="180" y1="${l2 ? "410" : "392"}" x2="420" y2="${l2 ? "410" : "392"}" stroke="${dividerCol}" stroke-width="2"/>
  <text x="300" y="${l2 ? "452" : "440"}" text-anchor="middle" font-family="${font}" font-size="19" font-weight="600" fill="${brandCol}">Listed &amp; verified on</text>
  <text x="300" y="${l2 ? "492" : "482"}" text-anchor="middle" font-family="${font}" font-size="34" font-weight="800" fill="${theme === "dark" ? cream : emerald}">Humble Halal</text>
  <text x="300" y="${l2 ? "534" : "526"}" text-anchor="middle" font-family="${font}" font-size="18" font-weight="500" fill="${brandCol}">humblehalal.com</text>
</svg>`;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) return new Response("Not found", { status: 404 });

  const db = getSupabaseAdmin();
  if (!db) return new Response("Not available", { status: 503 });

  const { data: biz } = await db
    .from("businesses")
    .select("name,halal_tier,attributes")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!biz) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";
  const download = url.searchParams.get("download") === "1";
  const svg = stickerSvg(String(biz.name || ""), statusLabel(biz.halal_tier, biz.attributes), theme);

  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    "X-Content-Type-Options": "nosniff",
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="${slug}-humble-halal-verified.svg"`;

  return new Response(svg, { status: 200, headers });
}
