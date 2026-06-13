import { NextResponse } from "next/server";
import { askHotel, liteapiConfigured } from "@/lib/liteapi";

/* "Ask AI about this hotel" — LiteAPI answers natural-language questions from the
   hotel's own published information (Beta). Factual Q&A, not a halal assertion.
   Graceful without a key. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const hotelId = (sp.get("hotelId") || "").trim();
  const q = (sp.get("q") || "").trim().slice(0, 200);
  if (!hotelId || q.length < 3) return NextResponse.json({ ok: false, error: "Ask a question" }, { status: 422 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, answer: "" });

  try {
    const r = await askHotel(hotelId, q);
    if (!r) return NextResponse.json({ ok: false, error: "No answer available" }, { status: 502 });
    return NextResponse.json({ ok: true, answer: r.answer, searchUsed: r.searchUsed });
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't get an answer right now" }, { status: 502 });
  }
}
