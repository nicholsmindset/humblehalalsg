/* Seed ONE demo event (+ tiers, confirmed attendees, a pending approval) so the
   event management pages render populated for a walkthrough. Idempotent: wipes
   its own rows first. Delete later with: DEL=1 node scripts/seed-demo-event.mjs */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const EID = "demo-community-iftar", SLUG = "community-iftar-demo";
// wipe prior demo rows (tickets cascade from orders/event)
await sb.from("tickets").delete().eq("event_id", EID);
await sb.from("orders").delete().eq("event_id", EID);
await sb.from("events").delete().eq("id", EID);
if (process.env.DEL === "1") { console.log("✓ demo event removed."); process.exit(0); }

const { data: biz } = await sb.from("businesses").select("id").eq("slug", "kinara").maybeSingle();

const { error: evErr } = await sb.from("events").insert({
  id: EID, slug: SLUG, title: "Community Iftar 2027 (Demo)", business_id: biz?.id ?? null,
  is_free: false, capacity: 60, taken: 3, status: "published", date_iso: "2027-03-15",
  display: {
    catId: "community", cat: "Community", img: "1504674900247-0877df9cc836", tone: "gold",
    blurb: "A demo event to preview the organiser command centre — live stats, attendees, QR check-in and approvals.",
    venue: "Wisma Geylang Serai", area: "Geylang Serai", dateLabel: "15 Mar 2027", timeLabel: "6:30pm – 9:00pm",
    priceFrom: 15, requiresApproval: true, prayerNearby: true, halalCatering: true, featured: false,
    genderArrangement: "mixed", organiser: "Humble Halal (demo)",
    tiers: [{ name: "General", price: 15 }, { name: "Family (4 pax)", price: 50 }],
  },
});
if (evErr) { console.error("✗ event insert:", evErr.message); process.exit(1); }

// 3 confirmed paid attendees (+ valid tickets) → stats/attendees/check-in show data
const buyers = [["Aisyah Rahman", "aisyah.demo@example.com", 1500, "General"], ["Faizal Malek", "faizal.demo@example.com", 5000, "Family (4 pax)"], ["Nadia Kassim", "nadia.demo@example.com", 1500, "General"]];
for (const [name, email, cents, tier] of buyers) {
  const { data: ord } = await sb.from("orders").insert({ event_id: EID, business_id: biz?.id ?? null, buyer_email: email, amount_cents: cents, fee_cents: Math.round(cents * 0.05), status: "confirmed" }).select("id").single();
  await sb.from("tickets").insert({ order_id: ord.id, event_id: EID, tier, qr_ref: `DEMO-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, status: "valid" });
}
// 1 pending join-request → the /requests (approvals) page shows a row
await sb.from("orders").insert({ event_id: EID, business_id: biz?.id ?? null, buyer_email: "hopeful.demo@example.com", amount_cents: 0, status: "pending" });

const base = "http://localhost:3000";
console.log("✓ demo event seeded. View at:");
console.log(`  detail    ${base}/events/${SLUG}`);
console.log(`  manage    ${base}/events/${SLUG}/manage    (live stats + attendees + CSV)`);
console.log(`  check-in  ${base}/events/${SLUG}/checkin`);
console.log(`  approvals ${base}/events/${SLUG}/requests`);
console.log("  (sign in as admin to view manage/checkin/requests)");
