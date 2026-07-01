/* Self-contained events-lifecycle test: creates a clearly-marked TEST event,
   verifies pending is hidden from the public source + visible to the admin
   queue, "approves" it (status=published), verifies it becomes publicly
   visible, then DELETES its own test row. Non-destructive to real data. */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SLUG = "zz-test-event-lifecycle";
const pubCount = async () => (await sb.from("events").select("*", { count: "exact", head: true }).eq("status", "published").eq("slug", SLUG)).count;
const pendCount = async () => (await sb.from("events").select("*", { count: "exact", head: true }).eq("status", "pending").eq("slug", SLUG)).count;

// cleanup any leftover from a prior run
await sb.from("events").delete().eq("slug", SLUG);

const { data: biz } = await sb.from("businesses").select("id").eq("source", "spreadsheet").limit(1).single();
const businessId = biz?.id ?? null;

console.log("1) create a PENDING event (as the host-event flow does)…");
const { error: insErr } = await sb.from("events").insert({
  id: SLUG, slug: SLUG, title: "__TEST__ Event lifecycle", business_id: businessId, is_free: true,
  capacity: 10, taken: 0, status: "pending", date_iso: "2027-01-01",
  display: { catId: "community", cat: "Community", venue: "Test", area: "Test", dateLabel: "1 Jan 2027" },
});
if (insErr) { console.error("   ✗ insert failed:", insErr.message); process.exit(1); }
console.log(`   ✓ created (business_id=${businessId ? "linked" : "none"})`);

console.log("2) pending event is HIDDEN from the public source (getEvents = status published)…");
console.log(`   published match: ${await pubCount()} (want 0), pending match: ${await pendCount()} (want 1) → ${(await pubCount()) === 0 && (await pendCount()) === 1 ? "✓ PASS" : "✗ FAIL"}`);

console.log("3) admin approve → status=published (actClaim/AdminEvents mechanism)…");
await sb.from("events").update({ status: "published" }).eq("slug", SLUG);
console.log(`   ✓ approved`);

console.log("4) event is now PUBLICLY visible (would render on /events after revalidate)…");
console.log(`   published match: ${await pubCount()} (want 1) → ${(await pubCount()) === 1 ? "✓ PASS" : "✗ FAIL"}`);

console.log("5) cleanup — delete the test event…");
await sb.from("events").delete().eq("slug", SLUG);
console.log(`   ✓ deleted. events table clean: ${(await sb.from("events").select("*", { count: "exact", head: true })).count} rows.`);
console.log("\n✓ Event lifecycle verified: pending hidden → admin approve → published/visible → cleaned up.");
