/* Build-time flag only — safe to import anywhere without pulling the
   @supabase/* client libraries into the bundle. */
export const supabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
