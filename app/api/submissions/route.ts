import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { simulatedOr503 } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/* Unified intake for user-generated submissions:
   - suggest: recommend a place for the directory
   - claim:   business owner claims an existing listing
   - report:  flag an issue with a listing
   - listing: add-listing application (owner wizard)
   - event:   host-event application

   Rows land in the `submissions` table (service-role; RLS blocks direct
   client access) for admin review. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmissionType = "suggest" | "claim" | "report" | "listing" | "event";

type Body = {
  type?: SubmissionType;
  listingRef?: string;
  name?: string;
  email?: string;
  phone?: string;
  payload?: Record<string, unknown>;
  filePaths?: string[];
};

/** Required top-level fields per submission type. */
const REQUIRED: Record<SubmissionType, { field: keyof Body | string; message: string }[]> = {
  suggest: [{ field: "payload.businessName", message: "Please tell us the business name" }],
  claim: [
    { field: "listingRef", message: "Missing listing reference" },
    { field: "name", message: "Please tell us your name" },
    { field: "email", message: "Add an email so we can verify your claim" },
  ],
  report: [{ field: "payload.reason", message: "Please pick a reason" }],
  listing: [
    { field: "payload.name", message: "Please tell us the business name" },
    { field: "email", message: "Add a contact email" },
  ],
  event: [
    { field: "payload.title", message: "Please give the event a title" },
    { field: "email", message: "Add a contact email" },
  ],
};

function pick(body: Body, path: string): unknown {
  if (path.startsWith("payload.")) return body.payload?.[path.slice("payload.".length)];
  return body[path as keyof Body];
}

export async function POST(req: Request) {
  if (!rateLimit(req, { key: "submissions", limit: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions — please try again in a minute" },
      { status: 429 },
    );
  }

  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const type = body.type as SubmissionType;
  if (!type || !(type in REQUIRED)) {
    return NextResponse.json({ ok: false, error: "Invalid submission type" }, { status: 422 });
  }

  for (const { field, message } of REQUIRED[type]) {
    const v = pick(body, String(field));
    if (!String(v ?? "").trim()) {
      return NextResponse.json({ ok: false, error: message, field }, { status: 422 });
    }
  }

  const email = String(body.email || "").trim();
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email", field: "email" },
      { status: 422 },
    );
  }

  const row = {
    type,
    listing_ref: String(body.listingRef || "").trim() || null,
    name: String(body.name || "").trim() || null,
    email: email || null,
    phone: String(body.phone || "").trim() || null,
    payload: body.payload ?? {},
    file_paths: Array.isArray(body.filePaths) ? body.filePaths.slice(0, 10) : [],
    status: "new",
  };

  const db = getSupabaseAdmin();
  if (!db) return simulatedOr503();

  try {
    const { error } = await db.from("submissions").insert(row);
    if (error) {
      return NextResponse.json({ ok: false, error: "Could not submit — please try again" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not submit — please try again" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
