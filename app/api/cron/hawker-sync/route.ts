import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* Weekly NEA hawker-centre sync. Pulls the NEA hawker-centres open dataset from
   data.gov.sg and INSERTS any new centres into hawker_centres (source='NEA').
   Centres are factual public data — safe to auto-add. It never creates or edits
   STALLS (halal accuracy stays human-curated) and never overwrites a curated
   centre (insert-only). Env-gated + graceful: no resource id / no keys → no-op.

   Set HAWKER_NEA_RESOURCE_ID to the data.gov.sg resource id for hawker centres
   (browse data.gov.sg → "Hawker Centres"). Licensed under Singapore Open Data
   Licence v1.0. */
export const dynamic = "force-dynamic";

const API = "https://data.gov.sg/api/action/datastore_search";
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pick = (r: Record<string, unknown>, re: RegExp): string => { for (const k of Object.keys(r)) if (re.test(k)) { const v = r[k]; if (v != null && v !== "") return String(v); } return ""; };
const pickNum = (r: Record<string, unknown>, re: RegExp): number | null => { const v = pick(r, re); const n = Number(v); return Number.isFinite(n) && n !== 0 ? n : null; };

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const resourceId = process.env.HAWKER_NEA_RESOURCE_ID;
  if (!resourceId) return NextResponse.json({ ok: true, skipped: "HAWKER_NEA_RESOURCE_ID not set" });

  let added = 0, seen = 0, note = "";
  try {
    const res = await fetch(`${API}?resource_id=${resourceId}&limit=1000`, { cache: "no-store" });
    if (!res.ok) { note = `data.gov.sg ${res.status}`; }
    else {
      const json = await res.json();
      const records = json?.result?.records || [];
      seen = records.length;
      const { getSupabaseAdmin } = await import("@/lib/supabase/server");
      const sb = getSupabaseAdmin();
      if (sb && records.length) {
        for (const r of records as Record<string, unknown>[]) {
          const name = pick(r, /(hawker.?centre.?name|^name$|name)/i);
          if (!name) continue;
          const id = slugify(name).slice(0, 60);
          if (!id) continue;
          const centre = {
            id, name,
            address: pick(r, /address|location_of_centre|street/i) || null,
            lat: pickNum(r, /^lat|latitude/i),
            lng: pickNum(r, /^lng|^long|longitude/i),
            source: "NEA",
            updated_at: new Date().toISOString(),
          };
          // Insert-only: never overwrite a curated centre.
          const { error } = await sb.from("hawker_centres").upsert(centre, { onConflict: "id", ignoreDuplicates: true });
          if (!error) added++;
        }
        await sb.from("cron_runs").insert({ job: "hawker-sync", ok: true, notes: `${added} new of ${seen} NEA centres` });
      }
    }
  } catch (e) {
    note = String(e).slice(0, 120);
  }

  return NextResponse.json({ ok: true, seen, added, ...(note ? { note } : {}) });
}
