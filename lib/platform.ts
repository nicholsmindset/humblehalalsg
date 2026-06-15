import "server-only";
import { getSupabaseAdmin } from "./supabase/server";

/* Server-read platform settings that must be hydrated to the client (so every
   visitor sees the same state, not a per-browser localStorage value). Reads
   Supabase `platform_settings`, falling back to an env override, then OFF. */
const truthy = (v: string | undefined) => v === "1" || v === "true" || v === "on";

/** Admin-controlled Ramadan mode (iftar / open-late surfacing). */
export async function getRamadanMode(): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data } = await admin.from("platform_settings").select("ramadan_mode_enabled").eq("id", 1).maybeSingle();
      if (data && typeof data.ramadan_mode_enabled === "boolean") return data.ramadan_mode_enabled;
    } catch { /* fall through to env/default */ }
  }
  return truthy(process.env.RAMADAN_MODE_ENABLED);
}
