import { NextResponse } from "next/server";

/* RETIRED (go-live). The directory is now seeded from the real dataset via
   scripts/seed-spreadsheet.mjs (298 verified SG halal businesses). This route
   used to upsert the lib/data.ts MOCK listings into `businesses` (source='seed')
   — it is disabled so demo data can never be re-introduced into production. */
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "disabled: directory is seeded from real data (scripts/seed-spreadsheet.mjs)" },
    { status: 410 },
  );
}
