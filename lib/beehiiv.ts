/* Shared beehiiv capture helper.
   Centralises the one beehiiv subscriptions call used by /api/subscribe (newsletter),
   /api/leads (quote intake) and the checkout routes (owner lifecycle), so the
   custom-field tagging (source + intent + stage) is consistent everywhere.

   Without BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID it succeeds in "simulated"
   mode so every funnel keeps working in dev. */

type BeehiivField = { name: string; value: string };

/* Map a capture source to a coarse intent tag so beehiiv segments (and future
   email) can be made relevant. The source keeps the exact surface; intent is the
   segment that decides welcome flow + which revenue door we walk them toward. */
export function deriveIntent(source: string): string {
  const s = source.toLowerCase();
  if (s.startsWith("tool:")) return "deen";
  if (s.startsWith("travel") || s.startsWith("city") || s.startsWith("hotel") || s.startsWith("umrah") || s.startsWith("flight")) return "travel";
  if (s.startsWith("event")) return "events";
  if (s === "ramadan" || s === "hari-raya" || s === "guides" || s === "seasonal") return "seasonal";
  if (s === "for-business" || s === "advertise" || s === "claim" || s === "owner" || s === "add-listing" || s === "pricing" || s === "lead" || s === "checkout") return "owner";
  if (s === "footer" || s === "about" || s === "newsletter") return "general";
  // popup, hero, blog*, directory, listing, is-halal, landing → the food-discovery base
  return "foodie";
}

export type BeehiivResult = { ok: boolean; already?: boolean; simulated?: boolean; status?: number; configured?: boolean };

/* Upsert a subscriber into beehiiv with source/intent/stage attribution.
   - `sendWelcome` defaults true (newsletter opt-ins); set false for transactional
     captures (quote leads, checkout signals) so we don't fire the welcome email.
   - Returns { simulated } when beehiiv isn't configured, { already } when the
     email already existed (beehiiv 200 vs 201). Never throws. */
export async function beehiivSubscribe(p: {
  email: string;
  source: string;
  stage?: string;
  name?: string;
  sendWelcome?: boolean;
  referringSite?: string;
  extraFields?: BeehiivField[];
}): Promise<BeehiivResult> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !publicationId) return { ok: true, simulated: true, configured: false };

  const custom_fields: BeehiivField[] = [
    { name: "source", value: p.source },
    { name: "intent", value: deriveIntent(p.source) },
  ];
  if (p.stage) custom_fields.push({ name: "stage", value: p.stage });
  if (p.name) custom_fields.push({ name: "first_name", value: p.name });
  if (p.extraFields) custom_fields.push(...p.extraFields);

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          email: p.email,
          reactivate_existing: true,
          send_welcome_email: p.sendWelcome ?? true,
          utm_source: p.source,
          ...(p.referringSite ? { referring_site: p.referringSite } : {}),
          custom_fields,
        }),
      },
    );
    if (res.ok) return { ok: true, configured: true, ...(res.status === 200 ? { already: true } : {}) };
    return { ok: false, configured: true, status: res.status };
  } catch {
    return { ok: false, configured: true };
  }
}

/* Publishing note: the ONE newsletter publishing path is Beehiiv's native
   RSS-to-email pointed at /blog/feed.xml (dashboard config, no code). The old
   beehiivBroadcast() webhook direct-send and its weekly-digest cron were
   removed 2026-07 — they had never sent (BEEHIIV_BROADCAST_URL was never set)
   and a second dormant path is how publishing forks. */
