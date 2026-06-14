"use client";
// Shared helpers for the admin dashboard + public vendor scorecard.
// Adapted from dashboard.zip: the raw createClient singleton is replaced with
// our null-safe getSupabaseBrowser() (mock-mode safe). Callers must handle a
// null client (render an empty/zeroed state rather than crashing).

import { getSupabaseBrowser } from "./supabase/client";

/** Browser Supabase client, or null when not configured (mock-mode launch).
 *  Admin reads pass RLS because the admin is logged in; the public scorecard
 *  uses the anon-safe token RPC. */
export const getSb = getSupabaseBrowser;

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  custom: "Custom",
};

// Resolve a range key to [from, to) ISO timestamps in Singapore time.
// We compute day boundaries in Asia/Singapore (UTC+8) then convert to UTC ISO.
export function resolveRange(
  key: RangeKey,
  customFrom?: string, // 'YYYY-MM-DD'
  customTo?: string,
): { from: string; to: string } {
  const SG_OFFSET_MS = 8 * 60 * 60 * 1000;
  const nowSG = new Date(Date.now() + SG_OFFSET_MS);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  // midnight SG (as a UTC instant) for a given YYYY-MM-DD
  const sgMidnightUTC = (dateStr: string) =>
    new Date(new Date(`${dateStr}T00:00:00Z`).getTime() - SG_OFFSET_MS);

  const todayStr = ymd(nowSG);

  switch (key) {
    case "today": {
      const from = sgMidnightUTC(todayStr);
      return { from: from.toISOString(), to: new Date(from.getTime() + 864e5).toISOString() };
    }
    case "yesterday": {
      const to = sgMidnightUTC(todayStr);
      return { from: new Date(to.getTime() - 864e5).toISOString(), to: to.toISOString() };
    }
    case "7d":
    case "30d":
    case "90d": {
      const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
      const to = new Date(sgMidnightUTC(todayStr).getTime() + 864e5); // end of today SG
      return { from: new Date(to.getTime() - days * 864e5).toISOString(), to: to.toISOString() };
    }
    case "custom": {
      const f = customFrom ?? todayStr;
      const t = customTo ?? todayStr;
      return {
        from: sgMidnightUTC(f).toISOString(),
        to: new Date(sgMidnightUTC(t).getTime() + 864e5).toISOString(), // inclusive of "to" day
      };
    }
  }
}

export const LEAD_LABELS: Record<string, string> = {
  enquiry_form: "Get a quote",
  whatsapp: "WhatsApp",
  call: "Call",
  website: "Website",
  directions: "Directions",
  shortlist: "Shortlist",
};

export const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-SG");

export const pct = (num: number, den: number, dp = 1) =>
  den > 0 ? ((100 * num) / den).toFixed(dp) : "0";
