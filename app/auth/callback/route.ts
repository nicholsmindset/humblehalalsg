import { NextResponse } from "next/server";

/* OAuth / magic-link callback — exchanges the code for a session, then redirects
   home (or ?next=). No-op redirect when Supabase isn't configured. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    try {
      const { getSupabaseServer } = await import("@/lib/supabase/server");
      const sb = await getSupabaseServer();
      if (sb) await sb.auth.exchangeCodeForSession(code);
    } catch {
      /* fall through — redirect anyway */
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
