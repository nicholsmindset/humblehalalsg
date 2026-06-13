/* Build + download an .ics calendar file for an event. */
import type { EventItem } from "./types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Parse "4:00 PM – 11:00 PM" → { start: "16:00", end: "23:00" }. */
function parseTimes(timeLabel: string): { start: string; end: string } {
  const to24 = (t: string): string => {
    const m = t.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!m) return "09:00";
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3]?.toUpperCase();
    if (ap === "PM" && h < 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return `${pad(h)}:${pad(min)}`;
  };
  const parts = timeLabel.split(/[–-]/);
  const start = to24(parts[0] || "09:00");
  const end = to24(parts[1] || parts[0] || "10:00");
  return { start, end };
}

function stamp(dateISO: string, hm: string): string {
  // local floating time (no Z) so calendars treat it as the event's local time
  const [h, m] = hm.split(":");
  return `${dateISO.replace(/-/g, "")}T${h}${m}00`;
}

function esc(s: string): string {
  return s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
}

export function buildIcs(ev: EventItem): string {
  const { start, end } = parseTimes(ev.timeLabel);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Humble Halal//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${ev.id}@humblehalal.com`,
    `DTSTART:${stamp(ev.dateISO, start)}`,
    `DTEND:${stamp(ev.dateISO, end)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(ev.blurb)}`,
    `LOCATION:${esc(ev.venue + ", " + ev.area)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadIcs(ev: EventItem) {
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.id}-humble-halal.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
