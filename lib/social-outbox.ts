import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Social auto-posting outbox — enqueue on publish, dispatch approved rows to a
   provider webhook. Modeled on lib/crm-sync.ts (claim → deliver → log). Never
   auto-posts: new rows are `pending_approval`; only human-`approved` rows send.
   Fails soft: no SOCIAL_WEBHOOK_URL → dispatch is a no-op; missing table → caught. */

export type SocialOutboxResult = { configured: boolean; claimed: number; delivered: number; failed: number };

export function socialOutboxConfigured(): boolean {
  return !!process.env.SOCIAL_WEBHOOK_URL;
}

/** Enqueue a piece of content for social sharing (idempotent on kind+ref_slug). */
export async function enqueueSocialPost(p: {
  kind?: string;
  refSlug: string;
  url: string;
  caption?: string;
  imageUrl?: string;
}): Promise<{ ok: boolean; queued?: boolean }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: true };
  try {
    const { error } = await sb
      .from("social_outbox")
      .upsert(
        {
          kind: p.kind || "blog_post",
          ref_slug: p.refSlug,
          url: p.url,
          caption: p.caption || null,
          image_url: p.imageUrl || null,
          status: "pending_approval",
        },
        { onConflict: "kind,ref_slug", ignoreDuplicates: true },
      );
    return { ok: !error, queued: !error };
  } catch {
    return { ok: false };
  }
}

async function deliver(row: { url: string; caption?: string | null; image_url?: string | null; kind: string }): Promise<boolean> {
  const webhook = process.env.SOCIAL_WEBHOOK_URL;
  if (!webhook) return false;
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.SOCIAL_WEBHOOK_SECRET ? { authorization: `Bearer ${process.env.SOCIAL_WEBHOOK_SECRET}` } : {}),
      },
      body: JSON.stringify({ url: row.url, caption: row.caption, image_url: row.image_url, kind: row.kind }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Deliver up to `limit` human-approved rows. Marks sent/failed + counts attempts. */
export async function dispatchSocialOutbox(limit = 10): Promise<SocialOutboxResult> {
  const sb = getSupabaseAdmin();
  if (!sb || !socialOutboxConfigured()) return { configured: false, claimed: 0, delivered: 0, failed: 0 };
  let delivered = 0;
  let failed = 0;
  try {
    const { data } = await sb
      .from("social_outbox")
      .select("id,kind,url,caption,image_url,attempt_count")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(limit);
    const rows = (data || []) as { id: string; kind: string; url: string; caption?: string | null; image_url?: string | null; attempt_count: number }[];
    for (const row of rows) {
      const ok = await deliver(row);
      if (ok) delivered++;
      else failed++;
      await sb
        .from("social_outbox")
        .update({
          status: ok ? "sent" : "failed",
          attempt_count: (row.attempt_count || 0) + 1,
          sent_at: ok ? new Date().toISOString() : null,
          provider: "webhook",
        })
        .eq("id", row.id);
    }
    return { configured: true, claimed: rows.length, delivered, failed };
  } catch {
    return { configured: true, claimed: 0, delivered, failed };
  }
}
