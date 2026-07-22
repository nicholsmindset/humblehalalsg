import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { getDirectory } from "@/lib/directory";
import { getEvents } from "@/lib/events-source";
import { scoreListing, certSuffix } from "@/lib/halal-score";
import { SITE } from "@/lib/seo";

/* Social content export (audit Gap 4).

   GET /api/admin/export/social[?format=csv][&kind=places|events]

   Publish-ready records for social production, so posts are written FROM the
   database instead of a human retyping facts (the retyping step is where
   status claims drift). Every row carries the status label from THE glossary
   (via scoreListing — the same label the site renders), the certification
   suffix, the last-checked date, the destination URL and the OG image URL.

   status_source_url is emitted as null until migration 0082 lands — the field
   is present so downstream templates can wire it once, and its null-ness is a
   visible reminder that a post cannot cite a source we don't hold.

   Admin-gated (service-role reads); JSON by default, CSV via ?format=csv. */

export const dynamic = "force-dynamic";

type Row = Record<string, string | number | boolean | null>;

function toCsv(rows: Row[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v: Row[string]) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

export async function GET(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ ok: true, simulated: true, places: [], events: [] });

  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  const kind = url.searchParams.get("kind"); // places | events | (both)

  const places: Row[] =
    kind === "events"
      ? []
      : (await getDirectory()).map((l) => {
          const hs = scoreListing(l);
          return {
            kind: "place",
            name: l.name,
            slug: l.slug || l.id,
            url: `${SITE.url}/business/${l.slug || l.id}`,
            category: l.catId,
            area: l.area,
            status_label: hs.label, // THE glossary label, same as the on-site pill
            cert_note: certSuffix(l), // "MUIS certified" / "MUIS-listed" / null
            muslim_owned: l.badges.includes("owned"),
            status_checked_at: l.verify?.verified ?? null,
            status_source_url: null, // pending migration 0082 — never cite a source we don't hold
            og_image: l.image || `${SITE.url}/business/${l.slug || l.id}/opengraph-image`,
          };
        });

  const events: Row[] =
    kind === "places"
      ? []
      : (await getEvents()).map((e) => ({
          kind: "event",
          name: e.title,
          slug: e.slug || e.id,
          url: `${SITE.url}/events/${e.slug}`,
          category: e.catId,
          area: e.area,
          starts: e.dateISO,
          expires: e.endsAt ?? e.dateISO, // last day the post may still point here
          free: e.free,
          og_image: e.img ? e.img : `${SITE.url}/opengraph-image`,
        }));

  if (format === "csv") {
    const rows = [...places, ...events];
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="humblehalal-social-export.csv"`,
      },
    });
  }
  return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), places, events });
}
