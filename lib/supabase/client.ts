"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser Supabase client, or null when not configured (mock-mode launch). */
export function getSupabaseBrowser() {
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}

export const supabaseConfigured = !!(url && anon);
