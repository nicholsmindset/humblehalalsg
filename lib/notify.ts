import { getSupabaseAdmin } from "@/lib/supabase/server";

/** Best-effort in-app notification (the bell). Never throws — a notify
 *  failure must never fail the transaction that triggered it. Only the
 *  service role can write (notifications has no insert RLS policy, 0033). */
export async function notify(n: {
  userId: string; // Clerk sub
  type: string;
  title: string;
  body?: string;
  link?: string;
  dedupeKey?: string;
}) {
  if (!n.userId) return;
  const db = getSupabaseAdmin();
  if (!db) return;
  try {
    await db.from("notifications").insert({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
      dedupe_key: n.dedupeKey ?? null,
    });
  } catch {
    /* dedupe hit or service hiccup — the triggering flow must not care */
  }
}
