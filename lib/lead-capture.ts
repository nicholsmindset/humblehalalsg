import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/feature-flags";

/* Lead-capture surface configuration (leads growth loop).
   The master switch is the `leadCapture` flag (env → platform_settings
   tri-state, admin Monetization tab). Per-surface granularity lives in
   platform_settings.lead_capture_surfaces jsonb — admin-edited from the
   Leads tab, no env fallback needed.
   Cached 30s (mirrors lib/feature-flags); FAIL-CLOSED: any error resolves to
   everything-off so a DB blip can never surprise-render capture UI. */

export type LeadCaptureSurface = "blog" | "hub" | "listing" | "popup";
export interface LeadCaptureConfig {
  enabled: boolean;
  surfaces: Record<LeadCaptureSurface, boolean>;
}

const OFF: LeadCaptureConfig = { enabled: false, surfaces: { blog: false, hub: false, listing: false, popup: false } };
const DEFAULT_SURFACES: Record<LeadCaptureSurface, boolean> = { blog: true, hub: true, listing: true, popup: true };

const TTL_MS = 30_000;
let cache: { value: LeadCaptureConfig; expiresAt: number } | null = null;

/** Invalidate after admin writes (lead-settings route). */
export function bustLeadCaptureCache(): void { cache = null; }

export async function getLeadCaptureConfig(): Promise<LeadCaptureConfig> {
  if (cache && cache.expiresAt > Date.now()) return { ...cache.value, surfaces: { ...cache.value.surfaces } };
  let out: LeadCaptureConfig = OFF;
  try {
    const enabled = (await getServerFlags()).leadCapture;
    if (enabled) {
      const surfaces = { ...DEFAULT_SURFACES };
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from("platform_settings").select("lead_capture_surfaces").eq("id", 1).maybeSingle();
        const raw = (data as { lead_capture_surfaces?: unknown } | null)?.lead_capture_surfaces;
        if (raw && typeof raw === "object") {
          for (const k of Object.keys(surfaces) as LeadCaptureSurface[]) {
            const v = (raw as Record<string, unknown>)[k];
            if (typeof v === "boolean") surfaces[k] = v;
          }
        }
      }
      out = { enabled: true, surfaces };
    }
  } catch { out = OFF; }
  cache = { value: out, expiresAt: Date.now() + TTL_MS };
  return { ...out, surfaces: { ...out.surfaces } };
}
