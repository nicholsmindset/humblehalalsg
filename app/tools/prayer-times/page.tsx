import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ToolShell } from "@/components/tools/tool-shell";
import { PrayerTimesTool } from "@/components/tools/prayer-times";

export const metadata: Metadata = pageMeta({
  title: "Prayer Times — daily salah times for your location",
  description:
    "Free, accurate daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) for your location, with a choice of calculation methods. No sign-up — your location stays on your device.",
  path: "/tools/prayer-times",
});

export default function Page() {
  return (
    <ToolShell
      slug="prayer-times"
      title="Prayer Times"
      intro="Today's salah times for wherever you are. Allow location access and pick the calculation method your community follows."
      foot={
        <p className="muted" style={{ marginTop: 18, fontSize: ".92rem" }}>
          In Singapore? See the full{" "}
          <Link className="link-inline" href="/waktu-solat-singapore">Waktu Solat Singapore timetable</Link>{" "}
          — today&apos;s MUIS-method times plus every month of the year.
        </p>
      }
    >
      <PrayerTimesTool />
    </ToolShell>
  );
}
