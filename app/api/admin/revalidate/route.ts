import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authorizeCron } from "@/lib/cron";

/* On-demand ISR purge for specific paths — the missing lever when a DB edit
   (admin verification pass, listing update) must show on a prerendered page
   NOW rather than after the daily revalidate / next cold deploy. Runtime reads
   are always fresh (proven: force-dynamic pages reflect DB edits immediately);
   this just drops the cached route so the next request re-renders.

   Guarded by the same CRON_SECRET bearer auth as the cron routes (fails closed
   in production). Usage:
     GET /api/admin/revalidate?path=/business/some-slug&path=/explore
   Each path must be site-relative ("/..."); count is capped per call. */
export const dynamic = "force-dynamic";

const MAX_PATHS = 100;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const raw = url.searchParams.getAll("path");
  const paths = raw.filter((p) => p.startsWith("/") && !p.startsWith("//")).slice(0, MAX_PATHS);
  if (!paths.length) return NextResponse.json({ ok: false, error: "No valid ?path= given" }, { status: 400 });

  const done: string[] = [];
  const failed: string[] = [];
  for (const p of paths) {
    try {
      revalidatePath(p);
      done.push(p);
    } catch {
      failed.push(p);
    }
  }
  return NextResponse.json({ ok: failed.length === 0, revalidated: done, failed, skipped: raw.length - paths.length });
}
