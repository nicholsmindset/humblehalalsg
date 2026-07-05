import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { mapCat, mapHalalHint, mapArea, postalFrom } from "@/lib/import-mapping";
import { parseCsv } from "@/lib/csv";

/* Admin bulk import: CSV (paste or file text) → staging_businesses rows with
   source:'import', which then flow through the SAME approval path as every
   other listing (admin queue → actListing → published). Never publishes
   directly — the review queue stays the single gate onto the live directory.

   POST { csv: string, commit?: boolean }
   - commit falsy → validate-only: per-row report, nothing written (the UI's
     preview step).
   - commit true  → insert the valid rows into staging, return the same report.

   Template: public/templates/business-import-template.csv (Google Sheets →
   File → Download → CSV). Header-driven, columns in any order; only `name`
   is required. Row cap 500 per import. */
export const dynamic = "force-dynamic";

const MAX_ROWS = 500;
const HEADERS = [
  "name", "category", "area", "address", "postal", "phone", "website",
  "description", "price_level", "halal", "attributes", "photo_url", "lat", "lng",
] as const;

type RowReport = { row: number; name: string; status: "ok" | "duplicate" | "error"; reason?: string };

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { csv?: string; commit?: boolean };
  const csv = String(body.csv || "");
  if (!csv.trim()) return NextResponse.json({ ok: false, error: "empty_csv" }, { status: 400 });
  if (csv.length > 2_000_000) return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });

  const grid = parseCsv(csv);
  if (grid.length < 2) return NextResponse.json({ ok: false, error: "no_data_rows" }, { status: 422 });

  // Header-driven column lookup (case/space-insensitive, any order).
  const header = grid[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col: Partial<Record<(typeof HEADERS)[number], number>> = {};
  for (const h of HEADERS) {
    const i = header.indexOf(h);
    if (i >= 0) col[h] = i;
  }
  if (col.name == null) return NextResponse.json({ ok: false, error: "missing_name_column" }, { status: 422 });

  const dataRows = grid.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json({ ok: false, error: "too_many_rows", max: MAX_ROWS }, { status: 422 });
  }
  const cell = (r: string[], k: (typeof HEADERS)[number]) => (col[k] != null ? String(r[col[k]!] ?? "").trim() : "");

  // Duplicate checks: existing published slugs + pending import staging slugs
  // + within-file repeats. One .in() query each, keyed by the slugified name.
  const slugs = dataRows.map((r) => slugify(cell(r, "name"))).filter(Boolean);
  const [{ data: existing }, { data: staged }] = await Promise.all([
    db.from("businesses").select("slug").in("slug", slugs),
    db.from("staging_businesses").select("slug").in("slug", slugs).in("review_status", ["new", "reviewing"]),
  ]);
  const taken = new Set([...(existing || []), ...(staged || [])].map((r) => String(r.slug)));

  const report: RowReport[] = [];
  const inserts: Record<string, unknown>[] = [];
  const seenInFile = new Set<string>();

  dataRows.forEach((r, idx) => {
    const rowNo = idx + 2; // 1-based + header row, matches what the user sees in Sheets
    const name = cell(r, "name").slice(0, 120);
    if (!name) { report.push({ row: rowNo, name: "(blank)", status: "error", reason: "name is required" }); return; }
    const slug = slugify(name);

    if (seenInFile.has(slug)) { report.push({ row: rowNo, name, status: "duplicate", reason: "repeated in this file" }); return; }
    seenInFile.add(slug);
    if (taken.has(slug)) { report.push({ row: rowNo, name, status: "duplicate", reason: "already in the directory or review queue" }); return; }

    const postal = postalFrom(cell(r, "postal"), cell(r, "address"));
    if (cell(r, "postal") && !postal) { report.push({ row: rowNo, name, status: "error", reason: "postal must be 6 digits" }); return; }
    const lat = cell(r, "lat") ? Number(cell(r, "lat")) : null;
    const lng = cell(r, "lng") ? Number(cell(r, "lng")) : null;
    if ((lat != null && Number.isNaN(lat)) || (lng != null && Number.isNaN(lng))) {
      report.push({ row: rowNo, name, status: "error", reason: "lat/lng must be numbers" }); return;
    }
    const website = cell(r, "website");
    if (website && !/^https?:\/\//i.test(website)) {
      report.push({ row: rowNo, name, status: "error", reason: "website must start with http(s)://" }); return;
    }
    const photoUrl = cell(r, "photo_url");
    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      report.push({ row: rowNo, name, status: "error", reason: "photo_url must start with http(s)://" }); return;
    }

    const catId = mapCat(cell(r, "category"));
    const { hint, attr } = mapHalalHint(cell(r, "halal"));
    const attributes = cell(r, "attributes")
      .split(/[,;]/).map((a) => a.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean);
    if (attr && !attributes.includes(attr)) attributes.push(attr);
    const priceLevel = cell(r, "price_level");

    inserts.push({
      name,
      slug,
      address: cell(r, "address") || null,
      postal,
      lat,
      lng,
      category_suggested: catId,
      source: "import",
      review_status: "new",
      provenance: { via: "admin-csv-import", by: gate.userId, row: rowNo },
      // actListing reads these from raw when publishing.
      raw: {
        area: mapArea(cell(r, "area")),
        address: cell(r, "address") || null,
        postal,
        description: cell(r, "description").slice(0, 2000) || null,
        phone: cell(r, "phone") || null,
        website: website || null,
        price_level: /^\${1,4}$/.test(priceLevel) ? priceLevel : null,
        attributes,
        photos: photoUrl ? [photoUrl] : [],
        halal_hint: hint, // admin verifies on HalalSG — never auto-granted
      },
    });
    report.push({ row: rowNo, name, status: "ok" });
  });

  const okCount = report.filter((x) => x.status === "ok").length;
  const counts = {
    ok: okCount,
    duplicate: report.filter((x) => x.status === "duplicate").length,
    error: report.filter((x) => x.status === "error").length,
  };

  if (!body.commit) return NextResponse.json({ ok: true, committed: false, counts, report });

  if (inserts.length) {
    const { error } = await db.from("staging_businesses").insert(inserts);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    await logAudit(db, {
      actor: gate.userId,
      action: "Bulk import (CSV) → review queue",
      target: "staging_businesses",
      meta: counts,
    });
  }
  return NextResponse.json({ ok: true, committed: true, counts, report });
}
