import { NextResponse } from "next/server";

/* MailerLite email capture.
   Set MAILERLITE_API_KEY (and optional MAILERLITE_GROUP_ID) in env.
   Without a key it succeeds in "simulated" mode so the UI works in dev. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "";
  let source = "newsletter";
  try {
    const body = await req.json();
    email = String(body?.email || "").trim();
    if (body?.source) source = String(body.source);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email" }, { status: 422 });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  // No key configured (e.g. local/dev) — accept gracefully without persisting.
  if (!apiKey) {
    return NextResponse.json({ ok: true, simulated: true });
  }

  try {
    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        ...(groupId ? { groups: [groupId] } : {}),
        fields: { source },
      }),
    });

    if (res.ok || res.status === 201 || res.status === 200) {
      return NextResponse.json({ ok: true });
    }
    // MailerLite returns 422 for already-subscribed / validation — treat duplicates as success.
    if (res.status === 422) {
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ ok: false, error: "Subscription failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "Subscription failed" }, { status: 502 });
  }
}
