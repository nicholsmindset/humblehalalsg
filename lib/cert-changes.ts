/* Humble Halal — public cert-lifecycle changelog data (the freshness moat).

   Reads dated cert_new / cert_renewed / cert_expired events from
   verification_log (0004) and joins them to PUBLISHED businesses only — a
   pending/suspended business name must never leak onto a public page. Events
   whose business is not published are silently dropped.

   Where events are emitted:
   - cert_new / cert_renewed → /api/admin/verify (grant) and /api/admin/cert
     (vault approve) — the two cert-approval write paths.
   - cert_renewed also → /api/cron/recheck-certs when a previously-lapsed
     business shows a future MUIS expiry again (out-of-band renewal detection).
   - cert_expired → /api/cron/recheck-certs (weekly re-check).

   ACCURACY: a cert_expired event is OUR dated record, never a fact about the
   business's halal status — copy on public surfaces must say "no longer listed
   per our records — verify on the official MUIS HalalSG register".

   Graceful: no Supabase / query error → empty results (clean empty states). */
import "server-only";
import { cache } from "react";
import { supabaseConfigured, getSupabaseAdmin } from "./supabase/server";
import { slugify } from "./slug";

export const CERT_CHANGE_EVENTS = ["cert_new", "cert_renewed", "cert_expired"] as const;
export type CertChangeEvent = (typeof CERT_CHANGE_EVENTS)[number];

export interface CertChange {
  id: string;
  event: CertChangeEvent;
  /** ISO timestamp of when OUR system logged the change (verification_log.created_at). */
  date: string;
  businessName: string;
  /** Slug for /business/[slug] (published businesses only). */
  businessSlug: string;
  area?: string;
}

const MAX_SCAN = 500; // newest log rows scanned per fetch — plenty for years of weekly runs

/** Newest-first cert lifecycle events joined with published business name/slug/area.
 *  Memoized per request (metadata + page + sitemap gate all call it). */
const fetchChanges = cache(async (): Promise<CertChange[]> => {
  if (!supabaseConfigured) return [];
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return [];

    const { data: rows, error } = await sb
      .from("verification_log")
      .select("id, business_id, event, created_at")
      .in("event", [...CERT_CHANGE_EVENTS])
      .order("created_at", { ascending: false })
      .limit(MAX_SCAN);
    if (error || !rows?.length) return [];

    const bizIds = [...new Set(rows.map((r) => String(r.business_id || "")).filter(Boolean))];
    if (!bizIds.length) return [];

    // Published businesses only — never leak pending/suspended names.
    const { data: biz } = await sb
      .from("businesses")
      .select("id, name, slug, area, status")
      .in("id", bizIds)
      .eq("status", "published");
    const byId = new Map<string, { name: string; slug: string; area?: string }>();
    for (const b of biz || []) {
      const name = String(b.name || "");
      if (!name) continue;
      byId.set(String(b.id), {
        name,
        slug: String(b.slug || "") || slugify(name),
        area: b.area ? String(b.area) : undefined,
      });
    }

    const out: CertChange[] = [];
    for (const r of rows) {
      const b = byId.get(String(r.business_id || ""));
      if (!b || !r.created_at) continue;
      out.push({
        id: String(r.id),
        event: r.event as CertChangeEvent,
        date: String(r.created_at),
        businessName: b.name,
        businessSlug: b.slug,
        area: b.area,
      });
    }
    return out;
  } catch {
    return [];
  }
});

/** Newest-first cert lifecycle changes (published businesses only). No DB → []. */
export async function certChanges(limit = 100): Promise<CertChange[]> {
  const all = await fetchChanges();
  return all.slice(0, Math.max(0, limit));
}

/** Count of publicly-surfaceable cert change events (capped at MAX_SCAN). */
export async function certChangeCount(): Promise<number> {
  return (await fetchChanges()).length;
}

/** Indexation gate for /halal-certification-changes (and its sitemap entry):
 *  the page stays noindex until we have logged enough real events. */
export async function certChangesIndexable(): Promise<boolean> {
  return (await certChangeCount()) >= 10;
}
