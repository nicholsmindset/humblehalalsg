import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { type Flags, type FlagKey, FLAG_COLUMN, envFlags } from "@/lib/flags";

/* Server-side flag resolution: DB overrides layered on top of env.
   Precedence: per-business override → global (platform_settings) → env → off.
   Fail-safe: any DB error resolves to env/off — a gate never throws. */

const TTL_MS = 30_000;
let cache: { value: Partial<Record<FlagKey, boolean>>; expiresAt: number } | null = null;

/** Invalidate the global-override cache (called by the admin write routes). */
export function bustFlagCache(): void { cache = null; }

/** Global admin overrides from platform_settings. NULL column → key absent
    (defer to env). Cached 30s; fail-safe to {} (→ env). Always returns a
    copy so no caller can mutate the shared cache for the TTL window. */
export async function getGlobalOverrides(): Promise<Partial<Record<FlagKey, boolean>>> {
  if (cache && cache.expiresAt > Date.now()) return { ...cache.value };
  const out: Partial<Record<FlagKey, boolean>> = {};
  try {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
      if (data) {
        for (const k of Object.keys(FLAG_COLUMN) as FlagKey[]) {
          const v = (data as Record<string, unknown>)[FLAG_COLUMN[k]];
          if (typeof v === "boolean") out[k] = v;
        }
      }
    }
  } catch { /* fail-safe → {} */ }
  cache = { value: out, expiresAt: Date.now() + TTL_MS };
  return { ...out };
}

/** Site-wide flags: global override ?? env. The gate every server route uses. */
export async function getServerFlags(): Promise<Flags> {
  const env = envFlags();
  const global = await getGlobalOverrides();
  const out = {} as Flags;
  for (const k of Object.keys(env) as FlagKey[]) out[k] = global[k] ?? env[k];
  return out;
}

/** Resolve a flag for a specific business: business override ?? global ?? env. */
export async function resolveBusinessFlag(feature: FlagKey, businessId: string): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    if (admin && businessId) {
      const { data } = await admin
        .from("business_feature_overrides")
        .select("enabled").eq("business_id", businessId).eq("feature_key", feature).maybeSingle();
      if (data && typeof (data as { enabled?: unknown }).enabled === "boolean") {
        return (data as { enabled: boolean }).enabled;
      }
    }
  } catch { /* fall through to global/env */ }
  return (await getServerFlags())[feature];
}
