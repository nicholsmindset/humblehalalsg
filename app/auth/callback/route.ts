import { NextResponse } from "next/server";

/* OAuth / magic-link callback — exchanges the code for a session, then redirects
   home (or ?next=). No-op redirect when Supabase isn't configured. */
/* Only allow same-site relative paths as the post-login redirect (security audit
   L1). Must start with a single "/" — rejecting "//evil.com" and "/\evil.com",
   which some clients treat as protocol-relative open redirects. */
function safeNext(n: string): string {
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next") || "/");

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
