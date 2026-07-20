/* Server component — the month timetable <table> shared by the hub and the 12
   monthly pages. Pure HTML (no client JS) so every row is crawlable. */
import type { CalendarDay } from "@/lib/prayer-times";

export function WaktuTable({
  rows,
  monthLabel,
  todayISO,
}: {
  rows: CalendarDay[];
  /** Caption label, e.g. "Julai 2026". */
  monthLabel: string;
  /** Today in SGT ("YYYY-MM-DD") — the matching row is highlighted. */
  todayISO: string;
}) {
  return (
    <div className="tbl-scroll" style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--white)" }}>
      <table className="tbl">
        <caption className="sr-only">Waktu solat Singapore — {monthLabel} prayer timetable (MUIS calculation method)</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Hijri</th>
            <th scope="col">Imsak</th>
            <th scope="col">Subuh</th>
            <th scope="col">Syuruk</th>
            <th scope="col">Zohor</th>
            <th scope="col">Asar</th>
            <th scope="col">Maghrib</th>
            <th scope="col">Isyak</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isToday = !!r.dateISO && r.dateISO === todayISO;
            return (
              <tr
                key={r.dateISO || r.day}
                {...(isToday ? { "aria-current": "date" as const } : {})}
                style={isToday ? { background: "var(--gold-50)", fontWeight: 600 } : undefined}
              >
                <td style={{ whiteSpace: "nowrap" }}>
                  {r.day} {monthLabel.split(" ")[0]}
                  {isToday && <span style={{ marginLeft: 6, fontSize: ".72rem", fontWeight: 700, color: "#6B5A2E" }}>today</span>}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{r.hijri}</td>
                <td>{r.imsak}</td>
                <td>{r.subuh}</td>
                <td>{r.syuruk}</td>
                <td>{r.zohor}</td>
                <td>{r.asar}</td>
                <td>{r.maghrib}</td>
                <td>{r.isyak}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Honest empty state when Aladhan is unreachable — never fabricated times. */
export function WaktuUnavailable({ monthLabel }: { monthLabel: string }) {
  return (
    <div className="notice notice-warn" role="status">
      <span>
        Prayer times for {monthLabel} are temporarily unavailable — we couldn&apos;t reach our timetable source just now.
        Please refresh shortly, or check the official MUIS timetable on{" "}
        <a className="link-inline" href="https://www.muis.gov.sg/" target="_blank" rel="noopener noreferrer">muis.gov.sg</a>{" "}
        or the MuslimSG app.
      </span>
    </div>
  );
}
