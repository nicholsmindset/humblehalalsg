import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Embeddable listing badge — an SVG a business pastes on its own website,
   linking back to its Humble Halal listing (see /for-business/badge for the
   snippet). Wording is derived from admin-reviewed data (halal_tier /
   attributes) and NEVER claims MUIS certification unless tier === "muis"
   (MUIS compliance posture — same ladder as scripts/gen-outreach-csv.mjs). */

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

function badgeSvg(name: string, label: string, theme: "light" | "dark"): string {
  const display = name.length > 26 ? `${name.slice(0, 25)}…` : name;
  const bg = theme === "dark" ? "#0d2b23" : "#ffffff";
  const border = theme === "dark" ? "#1d5b48" : "#d7e4de";
  const ink = theme === "dark" ? "#f3efe6" : "#123c30";
  const sub = theme === "dark" ? "#c8b98a" : "#0e7a5f";
  const brand = theme === "dark" ? "#8a97a3" : "#7c8a96";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="56" viewBox="0 0 200 56" role="img" aria-label="${esc(label)} — ${esc(display)} on Humble Halal">
  <rect x="0.5" y="0.5" width="199" height="55" rx="10" fill="${bg}" stroke="${border}"/>
  <circle cx="24" cy="28" r="13" fill="${theme === "dark" ? "#12463a" : "#e7f3ee"}"/>
  <path d="M27.5 20.5a8.4 8.4 0 1 0 3.3 11.4 9.4 9.4 0 0 1-3.3-11.4z" fill="${sub}"/>
  <text x="44" y="20" font-family="-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="10.5" font-weight="700" fill="${sub}">${esc(label)}</text>
  <text x="44" y="34" font-family="-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="11.5" font-weight="600" fill="${ink}">${esc(display)}</text>
  <text x="44" y="47" font-family="-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="9" font-weight="500" fill="${brand}">humblehalal.com</text>
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

  const theme = new URL(req.url).searchParams.get("theme") === "dark" ? "dark" : "light";
  const svg = badgeSvg(String(biz.name || ""), statusLabel(biz.halal_tier, biz.attributes), theme);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
