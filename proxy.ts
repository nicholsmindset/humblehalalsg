import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/* Session guard for account areas. Refreshes the Supabase auth cookie and
   redirects anonymous visitors to /login. Role checks (e.g. admin) happen
   server-side in the page/route — this only proves a session exists.

   When Supabase isn't configured the app runs in demo mode and the guard
   steps aside so the dashboards stay reachable. */

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/dashboard/:path*"],
};
