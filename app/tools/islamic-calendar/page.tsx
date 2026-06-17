import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { IslamicCalendar } from "@/components/tools/islamic-calendar";

export const metadata: Metadata = pageMeta({
  title: "Islamic Calendar — countdowns to Ramadan, Eid, Hajj & more",
  description:
    "Live countdowns to the major Islamic dates — Ramadan, Eid al-Fitr, Day of Arafah, Eid al-Adha, Islamic New Year, Ashura and more — with today's Hijri date. Free, no sign-up.",
  path: "/tools/islamic-calendar",
});

const ABOUT: { name: string; text: string }[] = [
  { name: "Islamic New Year (1 Muharram)", text: "Marks the start of the Hijri year, commemorating the Prophet's migration (Hijrah) from Makkah to Madinah." },
  { name: "Day of Ashura (10 Muharram)", text: "A day of fasting recommended by the Prophet ﷺ, marking the day Allah saved Musa and his people." },
  { name: "Ramadan", text: "The month of obligatory fasting, increased prayer, Quran and charity — the fourth pillar of Islam." },
  { name: "Laylat al-Qadr", text: "The Night of Decree, better than a thousand months, sought in the last ten nights of Ramadan." },
  { name: "Eid al-Fitr (1 Shawwal)", text: "The festival marking the end of Ramadan, beginning with the Eid prayer and giving of Zakat al-Fitr." },
  { name: "Day of Arafah (9 Dhul-Hijjah)", text: "The greatest day of Hajj; fasting it is recommended for those not on pilgrimage." },
  { name: "Eid al-Adha (10 Dhul-Hijjah)", text: "The festival of sacrifice during the days of Hajj, commemorating the devotion of Ibrahim." },
];

export default function Page() {
  return (
    <ToolShell
      slug="islamic-calendar"
      title="Islamic Calendar"
      intro="Today's Hijri date and live countdowns to the major Islamic occasions. Dates are approximate — the real observance follows the moon sighting."
      foot={
        <section style={{ maxWidth: 760, marginTop: 32 }}>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>About the Islamic dates</h2>
          <div className="stack g12">
            {ABOUT.map((a) => (
              <div key={a.name}>
                <strong>{a.name}</strong>
                <p className="muted" style={{ marginTop: 4 }}>{a.text}</p>
              </div>
            ))}
          </div>
        </section>
      }
    >
      <IslamicCalendar />
    </ToolShell>
  );
}
