/* Resolve a recipient email (+ display name) for transactional email, from a
   Clerk userId or a business. Best-effort — returns nulls when not found so the
   caller can skip sending without erroring. */
import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

function pickName(row: Record<string, unknown> | null | undefined): string | null {
  if (!row) return null;
  return (row.full_name as string) || (row.name as string) || null;
}

export async function emailForUser(db: Db, userId: string | null | undefined): Promise<{ email: string | null; name: string | null }> {
  if (!userId) return { email: null, name: null };
  try {
    const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
    return { email: (data?.email as string) || null, name: pickName(data as Record<string, unknown>) };
  } catch {
    return { email: null, name: null };
  }
}

export async function emailForBusinessOwner(db: Db, businessId: string | null | undefined): Promise<{ email: string | null; name: string | null; businessName: string | null }> {
  if (!businessId) return { email: null, name: null, businessName: null };
  try {
    const { data: b } = await db.from("businesses").select("name, owner_id, claimed_by").eq("id", businessId).maybeSingle();
    const uid = (b?.owner_id as string) || (b?.claimed_by as string) || null;
    const r = await emailForUser(db, uid);
    return { ...r, businessName: (b?.name as string) || null };
  } catch {
    return { email: null, name: null, businessName: null };
  }
}
