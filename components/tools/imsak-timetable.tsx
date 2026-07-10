"use client";

/* Imsak & Iftar times (Singapore) — the Ramadan fasting day at a glance.
   Uses the same official MUIS times (Aladhan method 11) as the rest of the
   site via /api/prayer-times. Imsak marks the end of suhoor (~10 min before
   Subuh, the common Singapore convention); Iftar is at Maghrib. Educational —
   confirm against the MUIS timetable. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";

type Row = { name: string; time: string; mins?: number };
type Data = { date?: string; hijri?: string; times: Row[] };

const IMSAK_OFFSET = 10; // minutes before Subuh (SG convention)

function toMins(r?: Row): number | null {
  if (!r) return null;
  if (typeof r.mins === "number") return r.mins;
  const [h, m] = (r.time || "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}
function fmt(mins: number | null): string {
  if (mins == null) return "—";
  const h24 = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
  const m = ((mins % 60) + 60) % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function ImsakTimetableTool() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/prayer-times")
      .then((r) => r.json())
      .then((d) => { if (alive) { if (d?.ok && Array.isArray(d.times)) setData({ date: d.date, hijri: d.hijri, times: d.times }); else setErr(true); } })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, []);

  const find = (n: string) => data?.times.find((t) => t.name.toLowerCase() === n);
  const subuh = find("subuh");
  const maghrib = find("maghrib");
  const imsakMins = subuh ? (toMins(subuh) ?? 0) - IMSAK_OFFSET : null;

  return (
    <div style={{ maxWidth: 620 }}>
      {err && !data ? (
        <div className="card" style={{ padding: 18 }}>
          <p className="muted">Live times are temporarily unavailable. Try the <Link className="link-inline" href="/tools/prayer-times">full prayer-times tool</Link>.</p>
        </div>
      ) : (
        <>
          <div className="flex g10 wrap" style={{ marginBottom: 14 }}>
            <div className="card" style={{ flex: "1 1 180px", padding: 16, background: "var(--emerald-50)", border: "1px solid var(--emerald-100)" }}>
              <div className="faint" style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>Imsak · suhoor ends</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "1.9rem", fontWeight: 800, color: "var(--emerald)", marginTop: 4 }}>{data ? fmt(imsakMins) : "…"}</div>
              <div className="faint" style={{ fontSize: ".8rem" }}>~{IMSAK_OFFSET} min before Subuh</div>
            </div>
            <div className="card" style={{ flex: "1 1 180px", padding: 16, background: "var(--gold-50)", border: "1px solid var(--gold-100)" }}>
              <div className="faint" style={{ fontSize: ".78rem", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>Iftar · break fast</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: "1.9rem", fontWeight: 800, color: "var(--gold-700)", marginTop: 4 }}>{data ? fmt(toMins(maghrib)) : "…"}</div>
              <div className="faint" style={{ fontSize: ".8rem" }}>at Maghrib</div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="flex between center" style={{ marginBottom: 8 }}>
              <strong>All times today</strong>
              {data?.date && <span className="faint" style={{ fontSize: ".84rem" }}>{data.date}{data.hijri ? ` · ${data.hijri}` : ""}</span>}
            </div>
            <div className="hub-grid" style={{ gap: 8 }}>
              <div className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>Imsak</span><span className="muted">{data ? fmt(imsakMins) : "…"}</span></div>
              {(data?.times || []).map((t) => (
                <div key={t.name} className="card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700 }}>{t.name === "Maghrib" ? "Maghrib · Iftar" : t.name}</span>
                  <span className="muted">{t.time}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="faint" style={{ fontSize: ".84rem", marginTop: 12 }}>
            Times follow the official MUIS timetable for Singapore (via the same source as the rest of the site), updated
            daily. Imsak (end of suhoor) is shown ~{IMSAK_OFFSET} minutes before Subuh per common practice — for the exact
            published Imsak, and the full monthly Ramadan timetable, see the{" "}
            <Link className="link-inline" href="/tools/prayer-times">prayer-times tool</Link> or the MUIS timetable.
          </p>
        </>
      )}
    </div>
  );
}
