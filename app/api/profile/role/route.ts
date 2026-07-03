import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Self-service role upgrade: user → owner ONLY. Called from the "List your
   business" surfaces and the post-OAuth-signup fallback (when the account-type
   choice couldn't ride Clerk unsafeMetadata into the user.created webhook).
   Strictly one-way and never touches admin — there is no self-serve path to
   any other role, and no downgrade (an owner clicking it again is a no-op). */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "profile-role", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const { error } = await admin
    .from("profiles")
    .update({ role: "owner" })
    .eq("id", userId)
    .eq("role", "user"); // only ever upgrades a plain user; admin/owner untouched
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
