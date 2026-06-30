import { NextResponse } from "next/server";

/* RETIRED (go-live). This one-shot demo seeder upserted the lib/data.ts MOCK
   listings + lib/events-data MOCK events into Supabase (source='seed'). The live
   directory is now seeded from the real dataset (scripts/seed-spreadsheet.mjs)
   and real events come from owners — so this is disabled to prevent demo data
   from re-entering production. */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "disabled: production uses real data (scripts/seed-spreadsheet.mjs); mock seeding retired" },
    { status: 410 },
  );
}
